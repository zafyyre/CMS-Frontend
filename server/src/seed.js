import { db, initSchema } from './db.js';
import { hashPassword } from './auth.js';

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Small deterministic PRNG so generated results are stable between runs.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Circle-method double round-robin for an even number of teams.
function doubleRoundRobin(ids) {
  const n = ids.length;
  const arr = [...ids];
  const firstLeg = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    firstLeg.push(pairs);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr.splice(0, arr.length, fixed, ...rest);
  }
  const secondLeg = firstLeg.map((pairs) => pairs.map(([a, b]) => [b, a]));
  return [...firstLeg, ...secondLeg];
}

// Saturday roughly 9 weeks before "now" so a season is mid-flight: some
// matchweeks are played (with results), the rest are upcoming fixtures.
function seasonStart() {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - 63);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  d.setDate(d.getDate() - ((day + 1) % 7)); // back up to a Saturday
  d.setHours(0, 0, 0, 0);
  return d;
}

const KICK_TIMES = ['12:00', '14:15', '16:30', '18:45', '20:30'];

/* ------------------------------------------------------------------ *
 * Reset
 * ------------------------------------------------------------------ */

initSchema();
for (const t of [
  'documents', 'sessions', 'users', 'players',
  'report_cards', 'game_reports', 'assignments', 'referees',
  'discipline', 'cup_matches', 'cups', 'matches', 'news', 'teams', 'fields', 'divisions',
]) {
  db.exec(`DELETE FROM ${t};`);
}

const SEASON = '2026-27';

/* ------------------------------------------------------------------ *
 * Divisions
 * ------------------------------------------------------------------ */

const divisions = [
  { name: 'Premier', desc: 'The top flight of the league, competing for the Premiership Shield.' },
  { name: 'Division 1', desc: 'Second tier — one promotion/relegation step below Premier.' },
  { name: 'Division 2', desc: 'Third tier of the Metro men’s pyramid.' },
  { name: 'Division 3', desc: 'Fourth tier of the Metro men’s pyramid.' },
  { name: 'Over 35 Premier', desc: 'Masters division for players aged 35 and over.' },
  { name: 'Under 21', desc: 'Development division for players aged 21 and under.' },
];
const insDiv = db.prepare(
  'INSERT INTO divisions (slug, name, season, sort_order, description) VALUES (?, ?, ?, ?, ?)'
);
const divisionId = {};
divisions.forEach((d, i) => {
  const slug = slugify(d.name);
  const r = insDiv.run(slug, d.name, SEASON, i, d.desc);
  divisionId[slug] = Number(r.lastInsertRowid);
});

/* ------------------------------------------------------------------ *
 * Fields
 * ------------------------------------------------------------------ */

const fields = [
  { name: 'Cedar Hollow Park', address: '700 Cedar Hollow Rd', city: 'Northlake', surface: 'Turf', lights: 1, notes: 'Full-size lit turf beside the transit exchange.' },
  { name: 'Beacon Fields', address: '3585 Beacon Way', city: 'Northlake', surface: 'Turf', lights: 1, notes: 'Two premium lit turf pitches at the civic grounds.' },
  { name: 'Willowmere Green', address: '5955 Willowmere Ave', city: 'Riverbend', surface: 'Grass', lights: 0, notes: 'Classic grass ground, daytime kickoffs only.' },
  { name: 'Harbourview Park', address: '89 Harbourview Blvd', city: 'Northlake', surface: 'Turf', lights: 1, notes: 'Downtown turf, a short walk from the rail platform.' },
  { name: 'Maplewood Commons', address: '5750 Maplewood Blvd', city: 'Fairhaven', surface: 'Grass', lights: 0, notes: 'West-side grass pitch.' },
  { name: 'Stonebridge Sports Park', address: '3760 Stonebridge Ave', city: 'Stonebridge', surface: 'Turf', lights: 1, notes: 'Sports complex with multiple lit fields.' },
  { name: 'Northlake Stadium', address: '3883 Stadium Rd', city: 'Northlake', surface: 'Turf', lights: 1, notes: 'Showcase stadium used for finals.' },
  { name: 'Foxglove Park', address: '1300 Foxglove Ave', city: 'Elmwood', surface: 'Turf', lights: 1, notes: 'Elmwood community home ground.' },
  { name: 'Ironwood Athletic Park', address: '7395 Ironwood St', city: 'Riverbend', surface: 'Turf', lights: 1, notes: 'Riverbend lit turf complex.' },
  { name: 'Grantham Secondary', address: '5350 Grantham Rd', city: 'Fairhaven', surface: 'Turf', lights: 1, notes: 'School turf, evening availability.' },
];
const insField = db.prepare(
  'INSERT INTO fields (slug, name, address, city, surface, lights, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
const fieldIds = [];
fields.forEach((f) => {
  const r = insField.run(slugify(f.name), f.name, f.address, f.city, f.surface, f.lights, f.notes);
  fieldIds.push(Number(r.lastInsertRowid));
});

/* ------------------------------------------------------------------ *
 * Teams
 * ------------------------------------------------------------------ */

const coaches = [
  'A. Whitfield', 'B. Marchetti', 'C. Okonkwo', 'D. Ashworth', 'E. Solberg', 'F. Larkin',
  'G. Ravensworth', 'H. Delacroix', 'I. Baptiste', 'J. Thornbury', 'K. Vasquez', 'L. Hollins',
  'M. Ferreira-Cole', 'N. Ashby', 'O. Grimaldi', 'P. Ellery', 'Q. Sandoval', 'R. Kimura',
];

// Fictional clubs. Several field multiple sides (A / B / Masters / U21),
// mirroring how a real amateur league's pyramid is structured.
const teamsByDiv = {
  premier: [
    ['Ashford United A', '#1b2a4a', 'Ashford United'],
    ['Kingsway FC A', '#b3122b', 'Kingsway FC'],
    ['Redwood SC A', '#1560bd', 'Redwood SC'],
    ['Bayside Athletic A', '#6b1f2e', 'Bayside Athletic'],
    ['Torrent FC A', '#0e7c7b', 'Torrent FC'],
    ['Silverpine FC A', '#0b6b3a', 'Silverpine FC'],
    ['Meridian FC A', '#5b2a86', 'Meridian FC'],
    ['Foxhill Rangers A', '#c8781a', 'Foxhill Rangers'],
  ],
  'division-1': [
    ['Halcyon FC A', '#1f4e8c', 'Halcyon FC'],
    ['Cobalt SC A', '#e07b00', 'Cobalt SC'],
    ['Granite City SC A', '#3a8dde', 'Granite City SC'],
    ['Juniper FC A', '#2e7d32', 'Juniper FC'],
    ['Kingsway FC B', '#b3122b', 'Kingsway FC'],
    ['Redwood SC B', '#1560bd', 'Redwood SC'],
    ['Torrent FC B', '#0e7c7b', 'Torrent FC'],
    ['Meridian FC B', '#5b2a86', 'Meridian FC'],
  ],
  'division-2': [
    ['Larkspur FC A', '#0d5c3a', 'Larkspur FC'],
    ['Ironside FC A', '#7a1f6b', 'Ironside FC'],
    ['Northgate FC A', '#1a7a7a', 'Northgate FC'],
    ['Orchard Park FC', '#334155', 'Orchard Park FC'],
    ['Halcyon FC B', '#1f4e8c', 'Halcyon FC'],
    ['Granite City SC B', '#3a8dde', 'Granite City SC'],
    ['Cobalt SC B', '#e07b00', 'Cobalt SC'],
    ['Bayside Athletic B', '#6b1f2e', 'Bayside Athletic'],
  ],
  'division-3': [
    ['Meridian FC C', '#5b2a86', 'Meridian FC'],
    ['Vireo FC', '#0e7c7b', 'Vireo FC'],
    ['Pinehurst SC', '#8a1c2b', 'Pinehurst SC'],
    ['Elmwood Hurricanes', '#d17a00', 'Elmwood Hurricanes'],
    ['Stonebridge FC', '#1f6f8b', 'Stonebridge FC'],
    ['Old Quarter Astro FC', '#334155', 'Old Quarter Astro'],
  ],
  'over-35-premier': [
    ['Bayside Athletic M-A', '#6b1f2e', 'Bayside Athletic'],
    ['Cobalt SC Masters', '#e07b00', 'Cobalt SC'],
    ['Westbrook FC M-A', '#2b5fa5', 'Westbrook FC'],
    ['Halcyon FC M-B', '#1f4e8c', 'Halcyon FC'],
    ['Kingsway FC Veterans', '#b3122b', 'Kingsway FC'],
    ['Redwood SC Masters', '#1560bd', 'Redwood SC'],
    ['Larkspur FC M', '#0d5c3a', 'Larkspur FC'],
    ['Foxhill Rangers M', '#c0392b', 'Foxhill Rangers'],
  ],
  'under-21': [
    ['Torrent FC U21', '#0e7c7b', 'Torrent FC'],
    ['Silverpine FC U21', '#0b6b3a', 'Silverpine FC'],
    ['Vireo FC U21', '#6a1b9a', 'Vireo FC'],
    ['Pinehurst SC U21', '#0277bd', 'Pinehurst SC'],
    ['Granite City SC U21', '#3a8dde', 'Granite City SC'],
    ['Redwood SC U21', '#1560bd', 'Redwood SC'],
  ],
};

const insTeam = db.prepare(
  'INSERT INTO teams (slug, name, club, division_id, color, coach, home_field_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
const teamId = {};
const teamsInDiv = {};
let coachIdx = 0;
let fieldIdx = 0;
for (const [divSlug, list] of Object.entries(teamsByDiv)) {
  teamsInDiv[divSlug] = [];
  for (const [name, color, club] of list) {
    const slug = slugify(name);
    const r = insTeam.run(
      slug,
      name,
      club,
      divisionId[divSlug],
      color,
      coaches[coachIdx++ % coaches.length],
      fieldIds[fieldIdx++ % fieldIds.length]
    );
    const id = Number(r.lastInsertRowid);
    teamId[slug] = id;
    teamsInDiv[divSlug].push(id);
  }
}

/* ------------------------------------------------------------------ *
 * Matches — generated schedule + deterministic results
 * ------------------------------------------------------------------ */

const insMatch = db.prepare(
  `INSERT INTO matches (division_id, round, kickoff, field_id, home_team_id, away_team_id, home_score, away_score, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const start = seasonStart();
const now = new Date();

for (const [divSlug, ids] of Object.entries(teamsInDiv)) {
  const rounds = doubleRoundRobin(ids);

  // The most recent past matchweek is left "awaiting result" — those games
  // have been played and reffed, but the referee's report is still pending,
  // so they don't count in the standings until the report is submitted.
  let awaitingRound = -1;
  rounds.forEach((_, ri) => {
    const date = new Date(start);
    date.setDate(date.getDate() + ri * 7);
    if (date < now) awaitingRound = ri;
  });

  rounds.forEach((pairs, ri) => {
    const date = new Date(start);
    date.setDate(date.getDate() + ri * 7);
    const past = date < now;
    const awaiting = ri === awaitingRound;
    pairs.forEach(([home, away], mi) => {
      const [hh, mm] = KICK_TIMES[mi % KICK_TIMES.length].split(':');
      const kickoff = new Date(date);
      kickoff.setHours(Number(hh), Number(mm), 0, 0);
      const fieldId = fieldIds[(ri + mi) % fieldIds.length];
      let hs = null;
      let as = null;
      if (past && !awaiting) {
        const rnd = mulberry32(hash(`${divSlug}-${ri}-${home}-${away}`));
        // slight home advantage
        hs = Math.floor(rnd() * 4.2 + rnd() * 0.8);
        as = Math.floor(rnd() * 3.6);
      }
      insMatch.run(
        divisionId[divSlug],
        ri + 1,
        kickoff.toISOString(),
        fieldId,
        home,
        away,
        hs,
        as,
        past && !awaiting ? 'final' : 'scheduled'
      );
    });
  });
}

/* ------------------------------------------------------------------ *
 * Referees, assignments & historical game reports
 * ------------------------------------------------------------------ */

const referees = [
  ['Jordan Ashcroft', 'Provincial'],
  ['Sam Okonjo', 'Regional'],
  ['Riley Beaumont', 'Regional'],
  ['Casey Lindqvist', 'District'],
  ['Morgan Delacroix', 'Provincial'],
  ['Avery Kingsley', 'Regional'],
  ['Quinn Marchetti', 'District'],
  ['Rowan Takahashi', 'Regional'],
  ['Devon Ashby', 'District'],
  ['Sasha Verhoeven', 'Provincial'],
];
const insRef = db.prepare(
  'INSERT INTO referees (slug, name, email, phone, grade, active) VALUES (?, ?, ?, ?, ?, 1)'
);
const refIds = [];
referees.forEach(([name, grade], i) => {
  const slug = slugify(name);
  const r = insRef.run(slug, name, `${slug}@nmslrefs.example`, `555-0${String(100 + i).padStart(3, '0')}`, grade);
  refIds.push(Number(r.lastInsertRowid));
});

const insAssign = db.prepare(
  'INSERT INTO assignments (match_id, referee_id, role, status, invited_at, responded_at) VALUES (?, ?, ?, ?, ?, ?)'
);
const insReport = db.prepare(
  'INSERT INTO game_reports (match_id, referee_id, home_score, away_score, abandoned, notes, submitted_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
);
const insCard = db.prepare(
  'INSERT INTO report_cards (report_id, team_id, player_name, card, minute, reason) VALUES (?, ?, ?, ?, ?, ?)'
);

const allMatches = db
  .prepare('SELECT id, division_id, round, kickoff, status, home_team_id, away_team_id, home_score, away_score FROM matches')
  .all();

// First upcoming round per division — used to decide which assignments are
// still open invitations the referee must accept.
const firstFuture = {};
for (const m of allMatches) {
  if (new Date(m.kickoff) >= now) {
    if (firstFuture[m.division_id] == null || m.round < firstFuture[m.division_id]) {
      firstFuture[m.division_id] = m.round;
    }
  }
}

const CARD_PLAYERS = ['A. Silva', 'J. Park', 'M. Brown', 'R. Gill', 'T. Costa', 'N. Ali', 'D. Wong', 'L. Ferreira', 'K. Adeyemi', 'S. Rossi', 'P. Nguyen', 'O. Martins'];
const YELLOW_REASONS = ['Unsporting behaviour', 'Dissent by word or action', 'Reckless challenge', 'Delaying the restart of play', 'Persistent infringement'];
const REPORT_NOTES = [
  'Clean, well-contested match. No major incidents.',
  'Competitive game managed without issue.',
  'Physical but fair throughout; both benches respectful.',
  'Routine fixture, nothing further to report.',
  'Good spirit from both sides. Fields in good condition.',
];

function isoShift(baseIso, days, hours = 0) {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

for (const m of allMatches) {
  const refId = refIds[m.id % refIds.length];
  const past = new Date(m.kickoff) < now;
  let status;
  let respondedAt = null;
  if (past) {
    status = 'accepted';
    respondedAt = isoShift(m.kickoff, -10);
  } else {
    const ff = firstFuture[m.division_id] ?? Infinity;
    if (m.round <= ff + 1) {
      status = 'invited'; // open invitation awaiting the referee's response
    } else {
      status = 'accepted';
      respondedAt = isoShift(m.kickoff, -12);
    }
  }
  insAssign.run(m.id, refId, 'Referee', status, isoShift(m.kickoff, -14), respondedAt);

  // Historical report for completed games. Games in the most recent
  // (awaiting) round have no report yet — that's what referees file.
  if (past && m.status === 'final') {
    const rnd = mulberry32(hash(`report-${m.id}`));
    const note = REPORT_NOTES[Math.floor(rnd() * REPORT_NOTES.length)];
    const rep = insReport.run(m.id, refId, m.home_score, m.away_score, note, isoShift(m.kickoff, 0, 2));
    const repId = Number(rep.lastInsertRowid);
    const nCards = Math.floor(rnd() * 3); // 0–2 cautions
    for (let c = 0; c < nCards; c++) {
      const side = rnd() < 0.5 ? m.home_team_id : m.away_team_id;
      const player = CARD_PLAYERS[Math.floor(rnd() * CARD_PLAYERS.length)];
      const minute = 10 + Math.floor(rnd() * 80);
      const reason = YELLOW_REASONS[Math.floor(rnd() * YELLOW_REASONS.length)];
      insCard.run(repId, side, player, 'Yellow', minute, reason);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Cups
 * ------------------------------------------------------------------ */

const insCup = db.prepare('INSERT INTO cups (slug, name, season, description) VALUES (?, ?, ?, ?)');
const insCupMatch = db.prepare(
  `INSERT INTO cup_matches (cup_id, round_name, round_order, slot, kickoff, field_id, home_team_id, away_team_id, home_label, away_label, home_score, away_score, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

function futureDate(weeks, hour = 19) {
  const d = new Date(now);
  d.setDate(d.getDate() + weeks * 7);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function pastDate(weeks, hour = 19) {
  const d = new Date(now);
  d.setDate(d.getDate() - weeks * 7);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Founders Cup — Premier knockout
const founders = Number(
  insCup.run(
    'founders-cup',
    'Founders Cup',
    SEASON,
    'The league’s premier knockout competition, contested by the top-flight clubs.'
  ).lastInsertRowid
);
const foundersQF = [
  ['ashford-united-a', 'foxhill-rangers-a', 3, 1],
  ['kingsway-fc-a', 'meridian-fc-a', 2, 1],
  ['redwood-sc-a', 'silverpine-fc-a', 0, 2],
  ['bayside-athletic-a', 'torrent-fc-a', 4, 2],
];
foundersQF.forEach(([h, a, hs, as], i) => {
  insCupMatch.run(founders, 'Quarterfinal', 1, i + 1, pastDate(3, 19 + (i % 2)), fieldIds[i], teamId[h], teamId[a], null, null, hs, as, 'final');
});
insCupMatch.run(founders, 'Semifinal', 2, 1, futureDate(1, 19), fieldIds[6], teamId['ashford-united-a'], teamId['kingsway-fc-a'], null, null, null, null, 'scheduled');
insCupMatch.run(founders, 'Semifinal', 2, 2, futureDate(1, 20), fieldIds[6], teamId['silverpine-fc-a'], teamId['bayside-athletic-a'], null, null, null, null, 'scheduled');
insCupMatch.run(founders, 'Final', 3, 1, futureDate(4, 18), fieldIds[6], null, null, 'Winner SF1', 'Winner SF2', null, null, 'scheduled');

// Masters Cup — Over 35 knockout
const mastersA = Number(
  insCup.run('masters-cup', 'Masters Cup', SEASON, 'Knockout cup for the Over 35 Premier division.').lastInsertRowid
);
insCupMatch.run(mastersA, 'Semifinal', 1, 1, pastDate(2, 19), fieldIds[5], teamId['bayside-athletic-m-a'], teamId['larkspur-fc-m'], null, null, 2, 0, 'final');
insCupMatch.run(mastersA, 'Semifinal', 1, 2, pastDate(2, 20), fieldIds[5], teamId['cobalt-sc-masters'], teamId['westbrook-fc-m-a'], null, null, 1, 3, 'final');
insCupMatch.run(mastersA, 'Final', 2, 1, futureDate(3, 18), fieldIds[6], teamId['bayside-athletic-m-a'], teamId['westbrook-fc-m-a'], null, null, null, null, 'scheduled');

/* ------------------------------------------------------------------ *
 * Discipline
 * ------------------------------------------------------------------ */

const insDisc = db.prepare(
  `INSERT INTO discipline (player_name, team_id, offense, sanction, games, incident_date, status, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
function dateStr(weeksAgo) {
  const d = new Date(now);
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}
// Sample disciplinary records. Player names here are invented for the demo.
const disc = [
  ['L. Ferreira', 'foxhill-rangers-a', 'Serious foul play', '3 game suspension', 3, dateStr(1), 'Active', 'Straight red — studs-up challenge.'],
  ['M. Okonkwo', 'meridian-fc-a', 'Second caution', '1 game suspension', 1, dateStr(1), 'Served', 'Two yellows in the same match.'],
  ['J. Bhullar', 'redwood-sc-a', 'Dissent toward official', '2 game suspension', 2, dateStr(2), 'Active', ''],
  ['A. Rossi', 'kingsway-fc-a', 'Violent conduct', '4 game suspension', 4, dateStr(2), 'Pending Hearing', 'Referred to the Discipline Committee.'],
  ['K. Brownlee', 'torrent-fc-a', 'Accumulation (5 cautions)', '1 game suspension', 1, dateStr(3), 'Served', ''],
  ['R. Santoro', 'bayside-athletic-a', 'Foul & abusive language', '3 game suspension', 3, dateStr(3), 'Active', ''],
  ['T. Adeyemi', 'silverpine-fc-a', 'Denying an obvious goal-scoring opportunity', '1 game suspension', 1, dateStr(4), 'Served', ''],
  ['D. Kimura', 'halcyon-fc-a', 'Second caution', '1 game suspension', 1, dateStr(1), 'Active', ''],
];
disc.forEach((d) => insDisc.run(d[0], teamId[d[1]] ?? null, d[2], d[3], d[4], d[5], d[6], d[7]));

/* ------------------------------------------------------------------ *
 * News & Notices
 * ------------------------------------------------------------------ */

const insNews = db.prepare(
  'INSERT INTO news (ref, category, title, body, posted_at, pinned) VALUES (?, ?, ?, ?, ?, ?)'
);
const news = [
  [2401, 'news', 'Welcome to the ' + SEASON + ' Season', 'The Northlake Metro Soccer League is back for another campaign. Fixtures, live standings, cup draws and discipline records are all available here. Best of luck to every club this season.', dateStr(9), 1],
  [2402, 'news', 'Founders Cup Semifinal Draw Confirmed', 'The Founders Cup semifinals are set: Ashford United A face Kingsway FC A, while Silverpine FC A meet Bayside Athletic A. Both ties are played at Northlake Stadium. See the Cup Play page for kickoff times.', dateStr(3), 0],
  [2403, 'notice', 'Discipline Hearings Held by Videoconference', 'All league discipline hearings continue to be held by videoconference. Clubs with a scheduled hearing will receive a link by email. See the Discipline page for the current suspension list.', dateStr(5), 1],
  [2404, 'news', 'Premier Division Title Race Tightens', 'With the season past its midpoint, the top of the Premier table is separated by a handful of points. Check the live Standings page — every result now shifts the table automatically.', dateStr(2), 0],
  [2405, 'notice', 'Field Closures — Grass Pitches', 'Following heavy rain, grass pitches (Willowmere Green, Maplewood Commons) may be subject to closure. Confirm playability with your club before travelling. Turf venues are unaffected.', dateStr(1), 0],
  [2406, 'news', 'Masters Cup Final Set', 'Bayside Athletic M-A will meet Westbrook FC M-A in the Masters Cup Final after wins in the semifinals. The final is scheduled at Northlake Stadium.', dateStr(2), 0],
  [2407, 'notice', 'Registration Open for Returning Clubs', 'Returning clubs may now confirm their team entries for the season. See the Registration page for fees, deadlines and required documentation.', dateStr(8), 0],
  [2408, 'news', 'Referee Recruitment Drive', 'The league is recruiting and developing match officials. If you are interested in refereeing in the Northlake Metro Soccer League, contact the league office through the About Us page.', dateStr(4), 0],
];
news.forEach((n) => insNews.run(...n));

/* ------------------------------------------------------------------ *
 * Players (rosters + season stats)
 * ------------------------------------------------------------------ */

const FIRST_NAMES = ['James', 'Liam', 'Noah', 'Diego', 'Mateo', 'Kai', 'Arjun', 'Hassan', 'Mohammed', 'Wei', 'Jin', 'David', 'Daniel', 'Luca', 'Marco', 'Nikola', 'Ivan', 'Tomas', 'Andre', 'Bruno', 'Carlos', 'Pedro', 'Sunny', 'Harjit', 'Gurpreet', 'Kevin', 'Ryan', 'Tyler', 'Aiden', 'Omar', 'Youssef', 'Kwame', 'Kofi', 'Nathan', 'Ethan', 'Lucas', 'Felix', 'Oscar', 'Leo', 'Mason'];
const LAST_NAMES = ['Silva', 'Santos', 'Nguyen', 'Tran', 'Singh', 'Gill', 'Sharma', 'Kim', 'Park', 'Chen', 'Wong', 'Costa', 'Ferreira', 'Oliveira', 'Rossi', 'Romano', 'Novak', 'Horvat', 'Popovic', 'Martinez', 'Garcia', 'Lopez', 'Hernandez', 'Brown', 'Wilson', 'Taylor', 'Adeyemi', 'Okafor', 'Mensah', 'Khan', 'Ali', 'Ahmed', 'Rahman', 'Yamamoto', 'Tanaka', 'MacDonald', 'Murphy', 'Petrov', 'Kowalski', 'Reyes'];
const POSITIONS = ['GK', 'GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'];
const ROSTER_SIZE = POSITIONS.length;

const insPlayer = db.prepare(
  `INSERT INTO players (team_id, slug, name, jersey, position, birth_year, appearances, goals, assists, yellow_cards, red_cards, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
);

const rosterByTeam = {}; // teamDbId -> [{id, name, ...}]
for (const [divSlug, list] of Object.entries(teamsByDiv)) {
  for (const [name] of list) {
    const tSlug = slugify(name);
    const tId = teamId[tSlug];
    const rnd = mulberry32(hash(`roster-${tSlug}`));
    rosterByTeam[tId] = [];
    const usedNames = new Set();
    for (let i = 0; i < ROSTER_SIZE; i++) {
      let pName;
      do {
        pName = `${FIRST_NAMES[Math.floor(rnd() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rnd() * LAST_NAMES.length)]}`;
      } while (usedNames.has(pName));
      usedNames.add(pName);
      const pos = POSITIONS[i];
      const birthYear = divSlug === 'under-21' ? 2005 + Math.floor(rnd() * 3)
        : divSlug === 'over-35-premier' ? 1980 + Math.floor(rnd() * 9)
        : 1990 + Math.floor(rnd() * 14);
      const appearances = 3 + Math.floor(rnd() * 8);
      const goals = pos === 'FW' ? Math.floor(rnd() * 9) : pos === 'MF' ? Math.floor(rnd() * 5) : pos === 'DF' ? Math.floor(rnd() * 2) : 0;
      const assists = pos === 'FW' ? Math.floor(rnd() * 5) : pos === 'MF' ? Math.floor(rnd() * 6) : pos === 'DF' ? Math.floor(rnd() * 3) : 0;
      const yellows = Math.floor(rnd() * 5);
      const reds = rnd() < 0.08 ? 1 : 0;
      const r = insPlayer.run(tId, `${tSlug}-p${i + 1}`, pName, i + 1, pos, birthYear, appearances, goals, assists, yellows, reds);
      rosterByTeam[tId].push({ id: Number(r.lastInsertRowid), name: pName });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Users (admin / coach / referee / player accounts) + documents
 * ------------------------------------------------------------------ */

const DEMO_PASSWORD = 'demo1234';
// All demo accounts share one password, so hashing it once keeps seeding fast.
// (A production build would enforce unique, user-chosen passwords.)
const pwCache = new Map();
function cred(password) {
  if (!pwCache.has(password)) pwCache.set(password, hashPassword(password));
  return pwCache.get(password);
}

const insUser = db.prepare(
  `INSERT INTO users (email, password_hash, password_salt, role, name, phone, status, referee_id, team_id, player_id, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
function addUser(email, role, name, opts = {}) {
  const { hash: h, salt } = cred(opts.password || DEMO_PASSWORD);
  const r = insUser.run(
    email.toLowerCase(), h, salt, role, name, opts.phone || '', opts.status || 'active',
    opts.referee_id ?? null, opts.team_id ?? null, opts.player_id ?? null,
    opts.created_at || isoShift(now.toISOString(), -30)
  );
  return Number(r.lastInsertRowid);
}

const insDoc = db.prepare(
  `INSERT INTO documents (user_id, category, type, title, status, submitted_at, reviewed_at, reviewed_by, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// Admins first (so they can be recorded as document reviewers)
const adminId = addUser('admin@nmsl.example', 'admin', 'League Administrator', { phone: '555-0100' });
addUser('registrar@nmsl.example', 'admin', 'League Registrar', { phone: '555-0101' });

function docStatus(seedStr) {
  const r = hash(seedStr) % 100;
  return r < 70 ? 'approved' : r < 92 ? 'pending' : 'rejected';
}
function addDoc(userId, category, type, filename, seedStr, submittedIso) {
  const status = docStatus(seedStr);
  const reviewed = status !== 'pending';
  insDoc.run(
    userId, category, type, filename, status, submittedIso,
    reviewed ? isoShift(submittedIso, 3) : null,
    reviewed ? adminId : null,
    status === 'rejected' ? 'Document unclear — please re-submit a legible copy.' : ''
  );
}

// Coaches — one account per team
const allTeams = db.prepare('SELECT id, slug, name, coach FROM teams ORDER BY id').all();
for (const t of allTeams) {
  const email = t.slug === 'ashford-united-a' ? 'coach@nmsl.example' : `coach.${t.slug}@nmsl.example`;
  const uid = addUser(email, 'coach', t.coach || 'Head Coach', { team_id: t.id, phone: '555-0110' });
  const sub = isoShift(now.toISOString(), -40);
  addDoc(uid, 'coach', 'Coaching License', 'coaching-license.pdf', `lic-${t.slug}`, sub);
  addDoc(uid, 'coach', 'Criminal Record Check (CRC)', 'crc.pdf', `crc-${t.slug}`, sub);
}

// Referees — link each referee to a login account
const allRefs = db.prepare('SELECT id, slug, name, email FROM referees ORDER BY id').all();
for (const rf of allRefs) {
  const email = rf.slug === 'jordan-ashcroft' ? 'referee@nmsl.example' : rf.email;
  addUser(email, 'referee', rf.name, { referee_id: rf.id, phone: '555-0120' });
}

// Players — give the first two players of every team an account
const REQUIRED_DOCS = [
  ['Photo ID', 'photo-id.jpg'],
  ['Player Registration Form', 'registration-form.pdf'],
  ['Medical Consent Form', 'medical-consent.pdf'],
];
let firstPlayerDone = false;
for (const t of allTeams) {
  const roster = rosterByTeam[t.id] || [];
  for (const p of roster.slice(0, 2)) {
    let email = `${slugify(p.name)}.${t.slug}@play.nmsl.example`;
    if (!firstPlayerDone) { email = 'player@nmsl.example'; firstPlayerDone = true; }
    const uid = addUser(email, 'player', p.name, { player_id: p.id, phone: '555-0130' });
    const sub = isoShift(now.toISOString(), -35);
    for (const [type, file] of REQUIRED_DOCS) addDoc(uid, 'player', type, file, `${type}-${p.id}`, sub);
  }
}

// A few brand-new player registrations awaiting admin approval
const PENDING_REGS = [
  ['Marcus Bell', 'ashford-united-a', 'FW'],
  ['Devon Clarke', 'torrent-fc-a', 'MF'],
  ['Ravi Prasad', 'meridian-fc-b', 'DF'],
];
PENDING_REGS.forEach(([name, tSlug, pos], i) => {
  const tId = teamId[tSlug];
  const pr = insPlayer.run(tId, `${tSlug}-reg${i + 1}`, name, 90 + i, pos, 1998, 0, 0, 0, 0, 0);
  const pid = Number(pr.lastInsertRowid);
  db.prepare("UPDATE players SET status = 'pending' WHERE id = ?").run(pid);
  const uid = addUser(`${slugify(name)}@example.com`, 'player', name, {
    player_id: pid, status: 'pending', phone: '555-0140', created_at: isoShift(now.toISOString(), -(i + 1)),
  });
  // Newly registered players have submitted some docs, all still pending review
  const sub = isoShift(now.toISOString(), -(i + 1));
  addDoc(uid, 'player', 'Photo ID', 'photo-id.jpg', `reg-id-${pid}-x`, sub); // seeds vary; forced pending below
  db.prepare("UPDATE documents SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL WHERE user_id = ?").run(uid);
});

/* ------------------------------------------------------------------ */

const counts = {
  divisions: db.prepare('SELECT COUNT(*) n FROM divisions').get().n,
  fields: db.prepare('SELECT COUNT(*) n FROM fields').get().n,
  teams: db.prepare('SELECT COUNT(*) n FROM teams').get().n,
  matches: db.prepare('SELECT COUNT(*) n FROM matches').get().n,
  played: db.prepare("SELECT COUNT(*) n FROM matches WHERE status='final'").get().n,
  cup_matches: db.prepare('SELECT COUNT(*) n FROM cup_matches').get().n,
  discipline: db.prepare('SELECT COUNT(*) n FROM discipline').get().n,
  news: db.prepare('SELECT COUNT(*) n FROM news').get().n,
  referees: db.prepare('SELECT COUNT(*) n FROM referees').get().n,
  assignments: db.prepare('SELECT COUNT(*) n FROM assignments').get().n,
  invitations: db.prepare("SELECT COUNT(*) n FROM assignments WHERE status='invited'").get().n,
  reports: db.prepare('SELECT COUNT(*) n FROM game_reports').get().n,
  awaiting: db.prepare("SELECT COUNT(*) n FROM matches WHERE status='scheduled' AND kickoff < datetime('now')").get().n,
  players: db.prepare('SELECT COUNT(*) n FROM players').get().n,
  users: db.prepare('SELECT COUNT(*) n FROM users').get().n,
  usersByRole: db.prepare('SELECT role, COUNT(*) n FROM users GROUP BY role').all().reduce((a, r) => ({ ...a, [r.role]: r.n }), {}),
  pendingRegs: db.prepare("SELECT COUNT(*) n FROM users WHERE status='pending'").get().n,
  documents: db.prepare('SELECT COUNT(*) n FROM documents').get().n,
  pendingDocs: db.prepare("SELECT COUNT(*) n FROM documents WHERE status='pending'").get().n,
};
console.log('Seed complete:', counts);
