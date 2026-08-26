/**
 * Static data adapter.
 *
 * The site is deployed as static files with no backend. Every read endpoint
 * was snapshotted into /data/**.json by scripts/bake-static.mjs, and this
 * module serves those files behind the same apiGet/apiPost signatures the
 * pages already use — so no page or component needed changing.
 *
 * Writes have nowhere to go without a server, so they are applied to an
 * "overlay" kept in localStorage and replayed over the baked reads. The
 * result is a demo where accepting an assignment or approving a registration
 * genuinely updates the UI and survives a reload, but only in that one
 * browser. Clearing site data resets everything to the baked snapshot.
 */

const DATA = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/data`;
const OVERLAY_KEY = 'nmsl.static.overlay';
const SESSION_KEY = 'nmsl.static.session';

/* ---------------------------------------------------------------- cache */
const cache = new Map();

async function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const promise = fetch(`${DATA}/${rel}.json`).then((res) => {
    if (!res.ok) {
      const err = new Error(res.status === 404 ? 'Not found' : `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  });
  cache.set(rel, promise);
  // A failed load must not stay cached, or one network blip breaks the page
  // for the rest of the session.
  promise.catch(() => cache.delete(rel));
  return promise;
}

/* -------------------------------------------------------------- overlay */
const readOverlay = () => {
  try { return JSON.parse(localStorage.getItem(OVERLAY_KEY)) || {}; } catch { return {}; }
};
const writeOverlay = (o) => {
  try { localStorage.setItem(OVERLAY_KEY, JSON.stringify(o)); } catch { /* private mode */ }
};
const patchOverlay = (fn) => { const o = readOverlay(); fn(o); writeOverlay(o); return o; };

export const readSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
};
const writeSession = (s) => {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* private mode */ }
};

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  throw err;
}
const notFound = () => fail('Not found', 404);
const unauthorized = () => fail('Not signed in', 401);

/* ------------------------------------------------------- read endpoints */
const DIRECT = {
  '/summary': 'summary',
  '/divisions': 'divisions',
  '/teams': 'teams',
  '/fields': 'fields',
  '/cups': 'cups',
  '/referees': 'referees',
  '/auth/demo-accounts': 'auth/demo-accounts',
};

const portal = (role) => load(`portal/${role}`);

/** Replays overlay decisions over a referee's baked assignment buckets. */
function applyAssignmentOverlay(assignments, overlay) {
  const responses = overlay.assignments || {};
  const reports = overlay.reports || {};
  if (!Object.keys(responses).length && !Object.keys(reports).length) return assignments;

  const out = JSON.parse(JSON.stringify(assignments));
  const accepted = [];
  out.invitations = (out.invitations || []).filter((a) => {
    const decision = responses[a.assignment_id];
    if (!decision) return true;
    if (decision === 'accept') accepted.push({ ...a, status: 'accepted' });
    return false;
  });
  out.upcoming = [...(out.upcoming || []), ...accepted]
    .sort((a, b) => String(a.match ? a.match.kickoff : '').localeCompare(String(b.match ? b.match.kickoff : '')));

  const markReported = (a) => (reports[a.assignment_id]
    ? { ...a, awaiting: 0, report: { ...(a.report || {}), ...reports[a.assignment_id] } }
    : a);
  out.upcoming = out.upcoming.map(markReported);
  out.past = (out.past || []).map(markReported);

  const baseStats = out.stats || {};
  out.stats = {
    ...baseStats,
    invitations: out.invitations.length,
    upcoming: out.upcoming.length,
    awaiting: [...out.upcoming, ...out.past].filter((a) => a.awaiting).length,
    reports: (baseStats.reports || 0) + Object.keys(reports).length,
  };
  return out;
}

export async function staticGet(path) {
  const [bare, qs] = path.split('?');
  const q = new URLSearchParams(qs || '');
  const overlay = readOverlay();
  const session = readSession();

  if (DIRECT[bare]) return load(DIRECT[bare]);

  /* ---- public, parameterised ---- */
  if (bare === '/weekly') return load(`weekly/${Number(q.get('offset')) || 0}`);

  if (bare === '/discipline') {
    const all = await load('discipline');
    const status = q.get('status');
    return status ? all.filter((d) => d.status === status) : all;
  }

  if (bare === '/news') {
    const all = await load('news');
    const cat = q.get('category');
    const rows = cat ? all.filter((n) => n.category === cat) : all;
    const limit = Number(q.get('limit')) || 0;
    return limit > 0 ? rows.slice(0, limit) : rows;
  }

  let m = bare.match(/^\/divisions\/([^/]+)\/matches$/);
  if (m) {
    const round = q.get('round');
    return load(round ? `divisions/${m[1]}/matches-round-${round}` : `divisions/${m[1]}/matches`);
  }
  m = bare.match(/^\/divisions\/([^/]+)$/);
  if (m) return load(`divisions/${m[1]}`);
  m = bare.match(/^\/teams\/([^/]+)$/);
  if (m) return load(`teams/${m[1]}`);
  m = bare.match(/^\/cups\/([^/]+)$/);
  if (m) return load(`cups/${m[1]}`);

  /* ---- session-scoped ---- */
  // Matches the server exactly: always 200, with a null user when signed out.
  // AuthContext reads `d.user` and treats null as a stale token.
  if (bare === '/auth/me') return { user: session ? session.user : null };

  if (bare === '/me/documents') {
    if (!session) unauthorized();
    const base = (await portal(session.user.role)).documents || [];
    return [...(overlay.myDocuments || []), ...base];
  }

  if (bare === '/me/assignments') {
    if (!session) unauthorized();
    const p = await portal('referee');
    return applyAssignmentOverlay(p.assignments, overlay);
  }

  if (bare === '/coach/dashboard') {
    if (!session) unauthorized();
    return (await portal('coach')).dashboard;
  }

  if (bare === '/player/dashboard') {
    if (!session) unauthorized();
    return (await portal('player')).dashboard;
  }

  /* ---- admin ---- */
  if (bare.startsWith('/admin/')) {
    if (!session || session.user.role !== 'admin') unauthorized();
    const { admin } = await portal('admin');
    const regStatus = overlay.registrations || {};
    const docStatus = overlay.documents || {};

    if (bare === '/admin/overview') {
      return {
        ...admin.overview,
        pendingRegistrations: Math.max(0, admin.overview.pendingRegistrations - Object.keys(regStatus).length),
        pendingDocuments: Math.max(0, admin.overview.pendingDocuments - Object.keys(docStatus).length),
      };
    }
    if (bare === '/admin/registrations') {
      return (admin.registrations || []).filter((r) => !regStatus[r.id]);
    }
    if (bare === '/admin/documents') {
      return (admin.documents || []).filter((d) => !docStatus[d.id]);
    }
    if (bare === '/admin/users') {
      // Mirrors the server: role/status equality, q as a LIKE across name or
      // email, same 500-row ceiling. Baked order already matches the server's.
      let rows = admin.users || [];
      const role = q.get('role');
      const status = q.get('status');
      const term = (q.get('q') || '').toLowerCase();
      if (role) rows = rows.filter((u) => u.role === role);
      if (status) rows = rows.filter((u) => u.status === status);
      if (term) {
        rows = rows.filter((u) => String(u.name || '').toLowerCase().includes(term)
          || String(u.email || '').toLowerCase().includes(term));
      }
      return rows.slice(0, 500);
    }
  }

  return notFound();
}

/* ------------------------------------------------------ write endpoints */
export async function staticPost(path, body = {}) {
  const bare = path.split('?')[0];
  const session = readSession();

  if (bare === '/auth/login') {
    const { accounts, password } = await load('auth/demo-accounts');
    const email = String(body.email || '').trim().toLowerCase();
    const match = accounts.find((a) => a.email.toLowerCase() === email);
    if (!match || body.password !== password) fail('Wrong email or password.', 401);
    const { user } = await portal(match.role);
    const next = { token: `static-${match.role}`, user };
    writeSession(next);
    return next;
  }

  if (bare === '/auth/logout') { writeSession(null); return { ok: true }; }

  if (bare === '/auth/register') {
    // Self-registration has no server to persist to, so the account lives in
    // this browser only — mirroring the real flow's "pending approval" state.
    const name = `${body.first_name || ''} ${body.last_name || ''}`.trim();
    const user = {
      id: -Date.now(),
      name: name || body.name || 'New Player',
      email: body.email,
      role: 'player',
      status: 'pending',
      phone: body.phone || null,
      referee: null,
      team: null,
      player: null,
    };
    const next = { token: 'static-player-pending', user };
    writeSession(next);
    return next;
  }

  if (!session) unauthorized();

  let m = bare.match(/^\/assignments\/(\d+)\/respond$/);
  if (m) {
    const id = Number(m[1]);
    patchOverlay((o) => {
      o.assignments = o.assignments || {};
      o.assignments[id] = body.action === 'accept' ? 'accept' : 'decline';
    });
    return { ok: true, assignment_id: id, status: body.action };
  }

  m = bare.match(/^\/assignments\/(\d+)\/report$/);
  if (m) {
    const id = Number(m[1]);
    patchOverlay((o) => {
      o.reports = o.reports || {};
      o.reports[id] = {
        home_score: body.home_score,
        away_score: body.away_score,
        abandoned: body.abandoned ? 1 : 0,
        notes: body.notes || '',
        submitted_at: new Date().toISOString(),
      };
    });
    return { ok: true, assignment_id: id };
  }

  m = bare.match(/^\/admin\/users\/(\d+)\/status$/);
  if (m) {
    const id = Number(m[1]);
    patchOverlay((o) => {
      o.registrations = o.registrations || {};
      o.registrations[id] = body.status || 'active';
    });
    return { ok: true, id, status: body.status };
  }

  m = bare.match(/^\/admin\/documents\/(\d+)\/review$/);
  if (m) {
    const id = Number(m[1]);
    patchOverlay((o) => {
      o.documents = o.documents || {};
      o.documents[id] = body.status || 'approved';
    });
    return { ok: true, id, status: body.status };
  }

  if (bare === '/me/documents') {
    const doc = {
      id: -Date.now(),
      type: body.type || 'other',
      title: body.title || 'Untitled',
      status: 'pending',
      category: body.category || null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      notes: body.notes || null,
    };
    patchOverlay((o) => { o.myDocuments = [doc, ...(o.myDocuments || [])]; });
    return doc;
  }

  return notFound();
}

/** Wipes local demo changes, returning the site to the baked snapshot. */
export function resetStaticDemo() {
  try {
    localStorage.removeItem(OVERLAY_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
  cache.clear();
}
