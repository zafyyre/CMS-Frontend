import express from 'express';
import cors from 'cors';
import { db, initSchema, isEmpty } from './db.js';
import {
  hashPassword, verifyPassword, createSession, destroySession, currentUser, shapeUser,
} from './auth.js';

initSchema();
if (isEmpty()) {
  console.log('Database empty — seeding…');
  await import('./seed.js');
}

const app = express();
app.use(cors());
app.use(express.json());

// Use a dedicated var so a harness-injected PORT (used by the Vite dev
// server) can't collide with the API. The Vite proxy targets this port.
const PORT = process.env.API_PORT || 4000;

/* ------------------------------------------------------------------ *
 * Query helpers
 * ------------------------------------------------------------------ */

const MATCH_SELECT = `
  SELECT m.id, m.round, m.kickoff, m.status, m.home_score, m.away_score, m.notes,
         ht.id home_id, ht.name home_name, ht.slug home_slug, ht.color home_color,
         at.id away_id, at.name away_name, at.slug away_slug, at.color away_color,
         d.name division_name, d.slug division_slug,
         f.name field_name, f.slug field_slug, f.city field_city,
         rf.name referee_name, rf.slug referee_slug, ra.status referee_status
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
  JOIN divisions d ON d.id = m.division_id
  LEFT JOIN fields f ON f.id = m.field_id
  LEFT JOIN assignments ra ON ra.match_id = m.id AND ra.role = 'Referee'
  LEFT JOIN referees rf ON rf.id = ra.referee_id
`;

function shapeMatch(r) {
  return {
    id: r.id,
    round: r.round,
    kickoff: r.kickoff,
    status: r.status,
    notes: r.notes || '',
    division: { name: r.division_name, slug: r.division_slug },
    field: r.field_name ? { name: r.field_name, slug: r.field_slug, city: r.field_city } : null,
    referee: r.referee_name ? { name: r.referee_name, slug: r.referee_slug, status: r.referee_status } : null,
    home: { id: r.home_id, name: r.home_name, slug: r.home_slug, color: r.home_color, score: r.home_score },
    away: { id: r.away_id, name: r.away_name, slug: r.away_slug, color: r.away_color, score: r.away_score },
  };
}

function getMatchById(id) {
  const row = db.prepare(MATCH_SELECT + ' WHERE m.id = ?').get(id);
  return row ? shapeMatch(row) : null;
}

function getReportForMatch(matchId) {
  const rep = db.prepare(`
    SELECT g.*, rf.name referee_name, rf.slug referee_slug
    FROM game_reports g LEFT JOIN referees rf ON rf.id = g.referee_id
    WHERE g.match_id = ?`).get(matchId);
  if (!rep) return null;
  const cards = db.prepare(`
    SELECT c.card, c.player_name, c.minute, c.reason, t.name team_name, t.slug team_slug
    FROM report_cards c LEFT JOIN teams t ON t.id = c.team_id
    WHERE c.report_id = ? ORDER BY c.minute`).all(rep.id);
  return {
    id: rep.id,
    home_score: rep.home_score,
    away_score: rep.away_score,
    abandoned: !!rep.abandoned,
    notes: rep.notes || '',
    submitted_at: rep.submitted_at,
    referee: rep.referee_name ? { name: rep.referee_name, slug: rep.referee_slug } : null,
    cards,
  };
}

function computeStandings(divisionId) {
  const teams = db.prepare('SELECT * FROM teams WHERE division_id = ?').all(divisionId);
  const table = new Map();
  for (const t of teams) {
    table.set(t.id, { team: t, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] });
  }
  const finals = db
    .prepare("SELECT * FROM matches WHERE division_id = ? AND status = 'final' ORDER BY kickoff")
    .all(divisionId);
  for (const m of finals) {
    const h = table.get(m.home_team_id);
    const a = table.get(m.away_team_id);
    if (!h || !a) continue;
    h.gp++; a.gp++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) {
      h.w++; a.l++; h.pts += 3; h.form.push('W'); a.form.push('L');
    } else if (m.home_score < m.away_score) {
      a.w++; h.l++; a.pts += 3; a.form.push('W'); h.form.push('L');
    } else {
      h.d++; a.d++; h.pts += 1; a.pts += 1; h.form.push('D'); a.form.push('D');
    }
  }
  const rows = [...table.values()].map((r) => ({ ...r, gd: r.gf - r.ga }));
  rows.sort(
    (x, y) =>
      y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.name.localeCompare(y.team.name)
  );
  return rows.map((r, i) => ({
    rank: i + 1,
    team_id: r.team.id,
    team: r.team.name,
    slug: r.team.slug,
    color: r.team.color,
    gp: r.gp, w: r.w, d: r.d, l: r.l,
    gf: r.gf, ga: r.ga, gd: r.gd, pts: r.pts,
    form: r.form.slice(-5),
  }));
}

function getWeekStart(date) {
  const d = new Date(date);
  const diff = (d.getDay() + 1) % 7; // Saturday = start of week
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const asyncRoute = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Resolve the authenticated user, enforcing role access. Returns null (after
// sending the appropriate 401/403) when the request should not proceed.
function requireUser(req, res, roles = null) {
  const u = currentUser(req);
  if (!u) {
    res.status(401).json({ error: 'Please log in to continue.' });
    return null;
  }
  if (u.status === 'suspended' || u.status === 'rejected') {
    res.status(403).json({ error: 'This account is not active. Please contact the league office.' });
    return null;
  }
  if (roles && !roles.includes(u.role)) {
    res.status(403).json({ error: 'You don’t have access to this area.' });
    return null;
  }
  return u;
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Divisions
app.get('/api/divisions', asyncRoute((req, res) => {
  const divs = db.prepare('SELECT * FROM divisions ORDER BY sort_order').all();
  res.json(divs.map((d) => ({
    ...d,
    team_count: db.prepare('SELECT COUNT(*) n FROM teams WHERE division_id = ?').get(d.id).n,
  })));
}));

app.get('/api/divisions/:slug', asyncRoute((req, res) => {
  const div = db.prepare('SELECT * FROM divisions WHERE slug = ?').get(req.params.slug);
  if (!div) return res.status(404).json({ error: 'Division not found' });
  const standings = computeStandings(div.id);
  const rounds = db
    .prepare('SELECT DISTINCT round FROM matches WHERE division_id = ? ORDER BY round')
    .all(div.id)
    .map((r) => r.round);
  res.json({ division: div, standings, rounds });
}));

app.get('/api/divisions/:slug/matches', asyncRoute((req, res) => {
  const div = db.prepare('SELECT * FROM divisions WHERE slug = ?').get(req.params.slug);
  if (!div) return res.status(404).json({ error: 'Division not found' });
  let sql = MATCH_SELECT + ' WHERE m.division_id = ?';
  const args = [div.id];
  if (req.query.round) { sql += ' AND m.round = ?'; args.push(Number(req.query.round)); }
  sql += ' ORDER BY m.kickoff, m.id';
  res.json(db.prepare(sql).all(...args).map(shapeMatch));
}));

// Schedule (cross-division, filterable)
app.get('/api/schedule', asyncRoute((req, res) => {
  let sql = MATCH_SELECT + ' WHERE 1=1';
  const args = [];
  if (req.query.division) { sql += ' AND d.slug = ?'; args.push(req.query.division); }
  if (req.query.status) { sql += ' AND m.status = ?'; args.push(req.query.status); }
  if (req.query.field) { sql += ' AND f.slug = ?'; args.push(req.query.field); }
  if (req.query.team) { sql += ' AND (ht.slug = ? OR at.slug = ?)'; args.push(req.query.team, req.query.team); }
  sql += ' ORDER BY m.kickoff, m.id';
  let rows = db.prepare(sql).all(...args).map(shapeMatch);
  const limit = Number(req.query.limit) || 0;
  if (limit > 0) rows = rows.slice(0, limit);
  res.json(rows);
}));

// Weekly schedule — matches within a Sat–Fri week, navigable by offset
app.get('/api/weekly', asyncRoute((req, res) => {
  const offset = Number(req.query.offset) || 0;
  const base = getWeekStart(new Date());
  base.setDate(base.getDate() + offset * 7);
  const end = new Date(base);
  end.setDate(end.getDate() + 7);
  const rows = db
    .prepare(MATCH_SELECT + ' WHERE m.kickoff >= ? AND m.kickoff < ? ORDER BY m.kickoff, d.sort_order, m.id')
    .all(base.toISOString(), end.toISOString())
    .map(shapeMatch);
  res.json({ weekStart: base.toISOString(), weekEnd: end.toISOString(), offset, matches: rows });
}));

// Teams
app.get('/api/teams', asyncRoute((req, res) => {
  let sql = `
    SELECT t.*, d.name division_name, d.slug division_slug, f.name field_name, f.slug field_slug
    FROM teams t
    JOIN divisions d ON d.id = t.division_id
    LEFT JOIN fields f ON f.id = t.home_field_id
    WHERE 1=1`;
  const args = [];
  if (req.query.division) { sql += ' AND d.slug = ?'; args.push(req.query.division); }
  sql += ' ORDER BY d.sort_order, t.name';
  res.json(db.prepare(sql).all(...args));
}));

app.get('/api/teams/:slug', asyncRoute((req, res) => {
  const team = db.prepare(`
    SELECT t.*, d.name division_name, d.slug division_slug,
           f.name field_name, f.slug field_slug, f.address field_address, f.city field_city
    FROM teams t
    JOIN divisions d ON d.id = t.division_id
    LEFT JOIN fields f ON f.id = t.home_field_id
    WHERE t.slug = ?`).get(req.params.slug);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const standings = computeStandings(team.division_id);
  const position = standings.find((s) => s.team_id === team.id) || null;

  const matches = db
    .prepare(MATCH_SELECT + ' WHERE m.home_team_id = ? OR m.away_team_id = ? ORDER BY m.kickoff')
    .all(team.id, team.id)
    .map(shapeMatch)
    .map((m) => {
      const isHome = m.home.id === team.id;
      let result = null;
      if (m.status === 'final') {
        const gf = isHome ? m.home.score : m.away.score;
        const ga = isHome ? m.away.score : m.home.score;
        result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
      }
      return { ...m, isHome, result };
    });

  res.json({ team, position, standings, matches });
}));

// Fields
app.get('/api/fields', asyncRoute((req, res) => {
  const rows = db.prepare('SELECT * FROM fields ORDER BY name').all();
  res.json(rows.map((f) => ({
    ...f,
    lights: !!f.lights,
    team_count: db.prepare('SELECT COUNT(*) n FROM teams WHERE home_field_id = ?').get(f.id).n,
  })));
}));

// Cups
app.get('/api/cups', asyncRoute((req, res) => {
  res.json(db.prepare('SELECT * FROM cups ORDER BY name').all());
}));

app.get('/api/cups/:slug', asyncRoute((req, res) => {
  const cup = db.prepare('SELECT * FROM cups WHERE slug = ?').get(req.params.slug);
  if (!cup) return res.status(404).json({ error: 'Cup not found' });
  const rows = db.prepare(`
    SELECT cm.*, ht.name home_name, ht.slug home_slug, ht.color home_color,
           at.name away_name, at.slug away_slug, at.color away_color,
           f.name field_name, f.city field_city
    FROM cup_matches cm
    LEFT JOIN teams ht ON ht.id = cm.home_team_id
    LEFT JOIN teams at ON at.id = cm.away_team_id
    LEFT JOIN fields f ON f.id = cm.field_id
    WHERE cm.cup_id = ?
    ORDER BY cm.round_order, cm.slot`).all(cup.id);

  const roundsMap = new Map();
  for (const r of rows) {
    if (!roundsMap.has(r.round_name)) roundsMap.set(r.round_name, { name: r.round_name, order: r.round_order, matches: [] });
    roundsMap.get(r.round_name).matches.push({
      id: r.id,
      kickoff: r.kickoff,
      status: r.status,
      field: r.field_name ? { name: r.field_name, city: r.field_city } : null,
      home: r.home_name
        ? { name: r.home_name, slug: r.home_slug, color: r.home_color, score: r.home_score }
        : { label: r.home_label },
      away: r.away_name
        ? { name: r.away_name, slug: r.away_slug, color: r.away_color, score: r.away_score }
        : { label: r.away_label },
    });
  }
  res.json({ cup, rounds: [...roundsMap.values()].sort((a, b) => a.order - b.order) });
}));

// Discipline
app.get('/api/discipline', asyncRoute((req, res) => {
  let sql = `
    SELECT dsc.*, t.name team_name, t.slug team_slug, t.color team_color
    FROM discipline dsc
    LEFT JOIN teams t ON t.id = dsc.team_id
    WHERE 1=1`;
  const args = [];
  if (req.query.status) { sql += ' AND dsc.status = ?'; args.push(req.query.status); }
  sql += ' ORDER BY dsc.incident_date DESC, dsc.id DESC';
  res.json(db.prepare(sql).all(...args));
}));

// News
app.get('/api/news', asyncRoute((req, res) => {
  let sql = 'SELECT * FROM news WHERE 1=1';
  const args = [];
  if (req.query.category) { sql += ' AND category = ?'; args.push(req.query.category); }
  sql += ' ORDER BY pinned DESC, posted_at DESC, id DESC';
  let rows = db.prepare(sql).all(...args);
  const limit = Number(req.query.limit) || 0;
  if (limit > 0) rows = rows.slice(0, limit);
  res.json(rows);
}));

app.get('/api/news/:id', asyncRoute((req, res) => {
  const row = db.prepare('SELECT * FROM news WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Post not found' });
  res.json(row);
}));

// Homepage summary
app.get('/api/summary', asyncRoute((req, res) => {
  const nowIso = new Date().toISOString();
  const news = db.prepare('SELECT * FROM news ORDER BY pinned DESC, posted_at DESC, id DESC LIMIT 5').all();
  const upcoming = db
    .prepare(MATCH_SELECT + " WHERE m.status = 'scheduled' AND m.kickoff >= ? ORDER BY m.kickoff LIMIT 6")
    .all(nowIso)
    .map(shapeMatch);
  const results = db
    .prepare(MATCH_SELECT + " WHERE m.status = 'final' ORDER BY m.kickoff DESC LIMIT 6")
    .all()
    .map(shapeMatch);
  const premier = db.prepare("SELECT id FROM divisions WHERE slug = 'premier'").get();
  const premierTop = premier ? computeStandings(premier.id).slice(0, 5) : [];
  const stats = {
    divisions: db.prepare('SELECT COUNT(*) n FROM divisions').get().n,
    teams: db.prepare('SELECT COUNT(*) n FROM teams').get().n,
    matches: db.prepare('SELECT COUNT(*) n FROM matches').get().n,
    played: db.prepare("SELECT COUNT(*) n FROM matches WHERE status = 'final'").get().n,
    goals: db.prepare("SELECT COALESCE(SUM(home_score + away_score), 0) n FROM matches WHERE status = 'final'").get().n,
    fields: db.prepare('SELECT COUNT(*) n FROM fields').get().n,
  };
  res.json({ news, upcoming, results, premierTop, stats });
}));

/* ------------------------------------------------------------------ *
 * Referees
 * ------------------------------------------------------------------ */

// Public directory of match officials
app.get('/api/referees', asyncRoute((req, res) => {
  const rows = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM assignments a WHERE a.referee_id = r.id AND a.status = 'accepted') games,
      (SELECT COUNT(*) FROM assignments a WHERE a.referee_id = r.id AND a.status = 'invited') pending,
      (SELECT COUNT(*) FROM game_reports g WHERE g.referee_id = r.id) reports
    FROM referees r ORDER BY r.name`).all();
  res.json(rows.map((r) => ({ ...r, active: !!r.active })));
}));

// Bucket a referee's assignments into invitations / upcoming / past.
function refereeBuckets(ref) {
  const rows = db
    .prepare('SELECT id assignment_id, match_id, role, status FROM assignments WHERE referee_id = ?')
    .all(ref.id);

  const now = Date.now();
  const invitations = [];
  const upcoming = [];
  const past = [];

  for (const a of rows) {
    const match = getMatchById(a.match_id);
    if (!match) continue;
    const item = { assignment_id: a.assignment_id, role: a.role, status: a.status, match };
    const isPast = new Date(match.kickoff).getTime() < now;
    if (a.status === 'invited') {
      invitations.push(item);
    } else if (a.status === 'accepted' && !isPast) {
      upcoming.push(item);
    } else if (a.status === 'accepted' && isPast) {
      const report = getReportForMatch(a.match_id);
      past.push({ ...item, report, awaiting: !report });
    }
    // declined assignments are dropped from the referee's active views
  }

  invitations.sort((x, y) => new Date(x.match.kickoff) - new Date(y.match.kickoff));
  upcoming.sort((x, y) => new Date(x.match.kickoff) - new Date(y.match.kickoff));
  past.sort((x, y) => new Date(y.match.kickoff) - new Date(x.match.kickoff));

  return {
    referee: { slug: ref.slug, name: ref.name, grade: ref.grade, email: ref.email, phone: ref.phone },
    stats: {
      upcoming: upcoming.length,
      invitations: invitations.length,
      past: past.length,
      awaiting: past.filter((p) => p.awaiting).length,
      reports: past.filter((p) => !p.awaiting).length,
    },
    invitations,
    upcoming,
    past,
  };
}

// A referee's assignments (admin-only; referees use /api/me/assignments)
app.get('/api/referees/:slug/assignments', asyncRoute((req, res) => {
  if (!requireUser(req, res, ['admin'])) return;
  const ref = db.prepare('SELECT * FROM referees WHERE slug = ?').get(req.params.slug);
  if (!ref) return res.status(404).json({ error: 'Referee not found' });
  res.json(refereeBuckets(ref));
}));

// Accept or decline an assignment invitation (referee who owns it, or admin)
app.post('/api/assignments/:id/respond', asyncRoute((req, res) => {
  const user = requireUser(req, res, ['referee', 'admin']);
  if (!user) return;
  const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  if (user.role !== 'admin' && a.referee_id !== user.referee_id) {
    return res.status(403).json({ error: 'This assignment isn’t yours.' });
  }
  const action = (req.body?.action || '').toLowerCase();
  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'action must be "accept" or "decline"' });
  }
  const status = action === 'accept' ? 'accepted' : 'declined';
  db.prepare('UPDATE assignments SET status = ?, responded_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), a.id);
  res.json({ ok: true, status });
}));

// Submit a game report: records the result, cautions/send-offs, and notes.
// Filing the report confirms the match result (feeding the standings) and
// opens a discipline record for any red card.
app.post('/api/assignments/:id/report', asyncRoute((req, res) => {
  const user = requireUser(req, res, ['referee', 'admin']);
  if (!user) return;
  const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  if (user.role !== 'admin' && a.referee_id !== user.referee_id) {
    return res.status(403).json({ error: 'This assignment isn’t yours.' });
  }
  if (db.prepare('SELECT id FROM game_reports WHERE match_id = ?').get(a.match_id)) {
    return res.status(409).json({ error: 'A report has already been submitted for this match.' });
  }
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(a.match_id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const b = req.body || {};
  const hs = Number(b.home_score);
  const as = Number(b.away_score);
  if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) {
    return res.status(400).json({ error: 'home_score and away_score must be non-negative integers.' });
  }
  const abandoned = b.abandoned ? 1 : 0;
  const cards = Array.isArray(b.cards) ? b.cards : [];

  const now = new Date().toISOString();
  const rep = db.prepare(
    'INSERT INTO game_reports (match_id, referee_id, home_score, away_score, abandoned, notes, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(a.match_id, a.referee_id, hs, as, abandoned, (b.notes || '').toString().slice(0, 1000), now);
  const reportId = Number(rep.lastInsertRowid);

  const insCard = db.prepare(
    'INSERT INTO report_cards (report_id, team_id, player_name, card, minute, reason) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insDisc = db.prepare(
    'INSERT INTO discipline (player_name, team_id, offense, sanction, games, incident_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (const c of cards) {
    const side = c.side === 'away' ? match.away_team_id : match.home_team_id;
    const player = (c.player || 'Unknown player').toString().slice(0, 80);
    const type = c.type === 'Red' ? 'Red' : 'Yellow';
    const minute = Number.isFinite(Number(c.minute)) ? Number(c.minute) : null;
    const reason = (c.reason || '').toString().slice(0, 200);
    insCard.run(reportId, side, player, type, minute, reason);
    // A send-off opens a discipline case automatically
    if (type === 'Red') {
      insDisc.run(
        player, side, reason || 'Send-off (red card)', 'Pending review', 0,
        match.kickoff.slice(0, 10), 'Pending Hearing',
        `Reported via game report for match #${match.id}.`
      );
    }
  }

  // Confirm the result so it counts in the standings
  db.prepare("UPDATE matches SET home_score = ?, away_score = ?, status = 'final' WHERE id = ?")
    .run(hs, as, a.match_id);

  res.status(201).json({ ok: true, report: getReportForMatch(a.match_id), match: getMatchById(a.match_id) });
}));

/* ------------------------------------------------------------------ *
 * Authentication
 * ------------------------------------------------------------------ */

app.post('/api/auth/login', asyncRoute((req, res) => {
  const email = (req.body?.email || '').toString().trim().toLowerCase();
  const password = (req.body?.password || '').toString();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (user.status === 'suspended' || user.status === 'rejected') {
    return res.status(403).json({ error: 'This account is not active. Please contact the league office.' });
  }
  const token = createSession(user.id);
  res.json({ token, user: shapeUser(user) });
}));

app.post('/api/auth/logout', asyncRoute((req, res) => {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) destroySession(h.slice(7).trim());
  res.json({ ok: true });
}));

app.get('/api/auth/me', asyncRoute((req, res) => {
  const user = currentUser(req);
  res.json({ user: user ? shapeUser(user) : null });
}));

// Curated demo logins so the login screen can offer one-click sign-in.
app.get('/api/auth/demo-accounts', asyncRoute((req, res) => {
  const list = [
    { role: 'admin', email: 'admin@nmsl.example', label: 'League administrator — full access' },
    { role: 'coach', email: 'coach@nmsl.example', label: 'Head coach — Ashford United A' },
    { role: 'player', email: 'player@nmsl.example', label: 'Player — view stats & documents' },
    { role: 'referee', email: 'referee@nmsl.example', label: 'Referee — assignments & reports' },
  ].filter((a) => db.prepare('SELECT 1 FROM users WHERE email = ?').get(a.email));
  res.json({ password: 'demo1234', accounts: list });
}));

// Player self-registration
app.post('/api/auth/register', asyncRoute((req, res) => {
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  const email = (b.email || '').toString().trim().toLowerCase();
  const password = (b.password || '').toString();
  const teamId = Number(b.team_id);
  const position = ['GK', 'DF', 'MF', 'FW'].includes(b.position) ? b.position : 'MF';

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return res.status(400).json({ error: 'Please choose the team you are registering with.' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const { hash, salt } = hashPassword(password);
  let user;
  db.exec('BEGIN');
  try {
    const pr = db.prepare(
      "INSERT INTO players (team_id, slug, name, position, status) VALUES (?, ?, ?, ?, 'pending')"
    ).run(teamId, `${team.slug}-reg-${Date.now()}`, name, position);
    const playerId = Number(pr.lastInsertRowid);
    const ur = db.prepare(
      "INSERT INTO users (email, password_hash, password_salt, role, name, status, player_id, created_at) VALUES (?, ?, ?, 'player', ?, 'pending', ?, ?)"
    ).run(email, hash, salt, name, playerId, new Date().toISOString());
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(ur.lastInsertRowid));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(409).json({ error: 'Could not complete registration. That email may already be in use.' });
  }
  const token = createSession(user.id);
  res.status(201).json({ token, user: shapeUser(user) });
}));

/* ------------------------------------------------------------------ *
 * Documents (current user)
 * ------------------------------------------------------------------ */

function shapeDoc(d) {
  return {
    id: d.id, type: d.type, title: d.title, status: d.status, category: d.category,
    submitted_at: d.submitted_at, reviewed_at: d.reviewed_at, notes: d.notes || '',
  };
}

app.get('/api/me/documents', asyncRoute((req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const rows = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY submitted_at DESC, id DESC').all(user.id);
  res.json(rows.map(shapeDoc));
}));

app.post('/api/me/documents', asyncRoute((req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const type = (req.body?.type || '').toString().trim();
  const title = (req.body?.title || '').toString().trim() || `${type}.pdf`;
  if (!type) return res.status(400).json({ error: 'Please choose a document type.' });
  const category = user.role === 'coach' ? 'coach' : user.role === 'player' ? 'player' : 'general';
  const r = db.prepare(
    "INSERT INTO documents (user_id, category, type, title, status, submitted_at) VALUES (?, ?, ?, ?, 'pending', ?)"
  ).run(user.id, category, type, title.slice(0, 120), new Date().toISOString());
  res.status(201).json(shapeDoc(db.prepare('SELECT * FROM documents WHERE id = ?').get(Number(r.lastInsertRowid))));
}));

/* ------------------------------------------------------------------ *
 * Referee (current user)
 * ------------------------------------------------------------------ */

app.get('/api/me/assignments', asyncRoute((req, res) => {
  const user = requireUser(req, res, ['referee']);
  if (!user) return;
  const ref = db.prepare('SELECT * FROM referees WHERE id = ?').get(user.referee_id);
  if (!ref) return res.status(404).json({ error: 'No referee profile is linked to this account.' });
  res.json(refereeBuckets(ref));
}));

/* ------------------------------------------------------------------ *
 * Team match helpers (used by coach & player dashboards)
 * ------------------------------------------------------------------ */

function teamUpcoming(teamId) {
  return db
    .prepare(MATCH_SELECT + " WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'scheduled' AND m.kickoff >= ? ORDER BY m.kickoff LIMIT 5")
    .all(teamId, teamId, new Date().toISOString())
    .map(shapeMatch);
}
function teamRecent(teamId) {
  return db
    .prepare(MATCH_SELECT + " WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'final' ORDER BY m.kickoff DESC LIMIT 5")
    .all(teamId, teamId)
    .map(shapeMatch);
}
function rosterFor(teamId) {
  // Active squad plus players still pending approval; rejected/suspended are excluded.
  return db
    .prepare("SELECT * FROM players WHERE team_id = ? AND status IN ('active', 'pending') ORDER BY jersey")
    .all(teamId);
}

/* ------------------------------------------------------------------ *
 * Coach dashboard
 * ------------------------------------------------------------------ */

app.get('/api/coach/dashboard', asyncRoute((req, res) => {
  const user = requireUser(req, res, ['coach']);
  if (!user) return;
  const team = db.prepare(`
    SELECT t.*, d.name division_name, d.slug division_slug
    FROM teams t JOIN divisions d ON d.id = t.division_id WHERE t.id = ?`).get(user.team_id);
  if (!team) return res.status(404).json({ error: 'No team is linked to this account.' });
  const position = computeStandings(team.division_id).find((s) => s.team_id === team.id) || null;
  const myDocuments = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY submitted_at DESC').all(user.id).map(shapeDoc);
  res.json({
    team: { id: team.id, name: team.name, slug: team.slug, color: team.color, club: team.club, division: team.division_name, divisionSlug: team.division_slug },
    position,
    roster: rosterFor(team.id),
    upcoming: teamUpcoming(team.id),
    recent: teamRecent(team.id),
    myDocuments,
  });
}));

/* ------------------------------------------------------------------ *
 * Player dashboard
 * ------------------------------------------------------------------ */

app.get('/api/player/dashboard', asyncRoute((req, res) => {
  const user = requireUser(req, res, ['player']);
  if (!user) return;
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(user.player_id);
  if (!player) return res.status(404).json({ error: 'No player profile is linked to this account.' });
  const team = player.team_id
    ? db.prepare('SELECT t.*, d.name division_name FROM teams t JOIN divisions d ON d.id = t.division_id WHERE t.id = ?').get(player.team_id)
    : null;
  const position = team ? computeStandings(team.division_id).find((s) => s.team_id === team.id) || null : null;
  const myDocuments = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY submitted_at DESC').all(user.id).map(shapeDoc);
  res.json({
    registrationStatus: user.status,
    player: {
      id: player.id, name: player.name, jersey: player.jersey, position: player.position,
      birth_year: player.birth_year, status: player.status,
      appearances: player.appearances, goals: player.goals, assists: player.assists,
      yellow_cards: player.yellow_cards, red_cards: player.red_cards,
    },
    team: team ? { id: team.id, name: team.name, slug: team.slug, color: team.color, division: team.division_name } : null,
    position,
    upcoming: team ? teamUpcoming(team.id) : [],
    recent: team ? teamRecent(team.id) : [],
    myDocuments,
  });
}));

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

app.get('/api/admin/overview', asyncRoute((req, res) => {
  if (!requireUser(req, res, ['admin'])) return;
  const byRole = db.prepare('SELECT role, COUNT(*) n FROM users GROUP BY role').all()
    .reduce((a, r) => ({ ...a, [r.role]: r.n }), {});
  res.json({
    users: db.prepare('SELECT COUNT(*) n FROM users').get().n,
    usersByRole: byRole,
    pendingRegistrations: db.prepare("SELECT COUNT(*) n FROM users WHERE status = 'pending'").get().n,
    pendingDocuments: db.prepare("SELECT COUNT(*) n FROM documents WHERE status = 'pending'").get().n,
    openDiscipline: db.prepare("SELECT COUNT(*) n FROM discipline WHERE status IN ('Active', 'Pending Hearing')").get().n,
    awaitingReports: db.prepare("SELECT COUNT(*) n FROM matches WHERE status = 'scheduled' AND kickoff < ?").get(new Date().toISOString()).n,
    teams: db.prepare('SELECT COUNT(*) n FROM teams').get().n,
    players: db.prepare('SELECT COUNT(*) n FROM players').get().n,
  });
}));

function shapeAdminUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone || '', linkedTo: u.linked_to || null, created_at: u.created_at };
}

app.get('/api/admin/users', asyncRoute((req, res) => {
  if (!requireUser(req, res, ['admin'])) return;
  // Resolve the linked team / referee / player-team name in one query (no N+1).
  let sql = `
    SELECT u.*, COALESCE(ct.name, rf.name, pt.name) AS linked_to
    FROM users u
    LEFT JOIN teams ct ON ct.id = u.team_id
    LEFT JOIN referees rf ON rf.id = u.referee_id
    LEFT JOIN players pl ON pl.id = u.player_id
    LEFT JOIN teams pt ON pt.id = pl.team_id
    WHERE 1=1`;
  const args = [];
  if (req.query.role) { sql += ' AND u.role = ?'; args.push(req.query.role); }
  if (req.query.status) { sql += ' AND u.status = ?'; args.push(req.query.status); }
  if (req.query.q) { sql += ' AND (u.name LIKE ? OR u.email LIKE ?)'; args.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  sql += ' ORDER BY u.role, u.name LIMIT 500';
  res.json(db.prepare(sql).all(...args).map(shapeAdminUser));
}));

app.get('/api/admin/registrations', asyncRoute((req, res) => {
  if (!requireUser(req, res, ['admin'])) return;
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.status, u.created_at, u.phone,
           p.position, p.jersey, t.name team_name, t.slug team_slug
    FROM users u
    LEFT JOIN players p ON p.id = u.player_id
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE u.role = 'player' AND u.status = 'pending'
    ORDER BY u.created_at DESC`).all();
  res.json(rows.map((r) => ({
    ...r,
    documents: db.prepare('SELECT COUNT(*) n FROM documents WHERE user_id = ?').get(r.id).n,
  })));
}));

app.post('/api/admin/users/:id/status', asyncRoute((req, res) => {
  const admin = requireUser(req, res, ['admin']);
  if (!admin) return;
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') {
    return res.status(403).json({ error: 'Administrator accounts can’t be changed here.' });
  }
  const action = (req.body?.action || '').toLowerCase();
  const map = { approve: 'active', reject: 'rejected', suspend: 'suspended', reactivate: 'active' };
  const status = map[action];
  if (!status) return res.status(400).json({ error: 'Unknown action.' });
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, target.id);
  if (target.player_id) {
    const pStatus = action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'active';
    db.prepare('UPDATE players SET status = ? WHERE id = ?').run(pStatus, target.player_id);
  }
  res.json({ ok: true, status });
}));

app.get('/api/admin/documents', asyncRoute((req, res) => {
  if (!requireUser(req, res, ['admin'])) return;
  let sql = `
    SELECT doc.*, u.name owner_name, u.email owner_email, u.role owner_role
    FROM documents doc JOIN users u ON u.id = doc.user_id WHERE 1=1`;
  const args = [];
  if (req.query.status) { sql += ' AND doc.status = ?'; args.push(req.query.status); }
  sql += " ORDER BY (doc.status = 'pending') DESC, doc.submitted_at DESC LIMIT 500";
  res.json(db.prepare(sql).all(...args).map((d) => ({
    ...shapeDoc(d),
    owner: { name: d.owner_name, email: d.owner_email, role: d.owner_role },
  })));
}));

app.post('/api/admin/documents/:id/review', asyncRoute((req, res) => {
  const admin = requireUser(req, res, ['admin']);
  if (!admin) return;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(Number(req.params.id));
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const action = (req.body?.action || '').toLowerCase();
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'action must be "approve" or "reject"' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  db.prepare('UPDATE documents SET status = ?, reviewed_at = ?, reviewed_by = ?, notes = ? WHERE id = ?')
    .run(status, new Date().toISOString(), admin.id, (req.body?.notes || '').toString().slice(0, 300), doc.id);
  res.json({ ok: true, status });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`NMSL API listening on http://localhost:${PORT}`));
