/**
 * Snapshots the Express API into static JSON under client/public/data.
 *
 * The dataset is seeded and fictional, so every read endpoint is a pure
 * function of the seed — it can be captured once and served as files. That
 * lets the whole site run on static hosting with no backend at all.
 *
 * Run locally with `npm run bake` after changing the seed or the API, then
 * commit the output. The deploy build does NOT run this: Netlify only builds
 * the client, so a broken API can never break a deploy.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const PORT = process.env.BAKE_PORT || 4321;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = new URL('../client/public/data/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

let written = 0;
let bytes = 0;

async function save(rel, data) {
  const file = join(OUT, `${rel}.json`);
  await mkdir(dirname(file), { recursive: true });
  const body = JSON.stringify(data);
  await writeFile(file, body);
  written += 1;
  bytes += Buffer.byteLength(body);
}

async function get(path, token) {
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo1234' }),
  });
  if (!res.ok) throw new Error(`login ${email} -> ${res.status}`);
  return res.json();
}

async function waitForApi() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => { setTimeout(r, 1000); });
  }
  throw new Error('API did not come up');
}

const server = spawn(process.execPath, ['server/src/index.js'], {
  env: { ...process.env, API_PORT: String(PORT), NODE_ENV: 'development' },
  stdio: ['ignore', 'ignore', 'inherit'],
});

try {
  await waitForApi();
  await rm(OUT, { recursive: true, force: true });

  // ---- public reads -----------------------------------------------------
  const [summary, divisions, teams, fields, cups, discipline, news, referees, demoAccounts] =
    await Promise.all([
      get('/api/summary'), get('/api/divisions'), get('/api/teams'), get('/api/fields'),
      get('/api/cups'), get('/api/discipline'), get('/api/news'), get('/api/referees'),
      get('/api/auth/demo-accounts'),
    ]);

  await save('summary', summary);
  await save('divisions', divisions);
  await save('teams', teams);
  await save('fields', fields);
  await save('cups', cups);
  await save('discipline', discipline);
  await save('news', news);
  await save('referees', referees);
  await save('auth/demo-accounts', demoAccounts);

  // Division detail + its matches. Per-round slices are baked rather than
  // filtered client-side because the API groups and orders them.
  for (const d of divisions) {
    const detail = await get(`/api/divisions/${d.slug}`);
    await save(`divisions/${d.slug}`, detail);
    await save(`divisions/${d.slug}/matches`, await get(`/api/divisions/${d.slug}/matches`));
    for (const round of detail.rounds || []) {
      await save(`divisions/${d.slug}/matches-round-${round}`, await get(`/api/divisions/${d.slug}/matches?round=${round}`));
    }
  }

  for (const t of teams) await save(`teams/${t.slug}`, await get(`/api/teams/${t.slug}`));
  for (const c of cups) await save(`cups/${c.slug}`, await get(`/api/cups/${c.slug}`));
  // /api/referees/:slug/assignments is auth-gated and the client never calls
  // it (referees read their own via /api/me/assignments), so it is not baked.

  // Weekly runs on an offset from the current week. Bake outward until both
  // directions have been empty for a while, so the arrows never dead-end
  // inside the season but the output stays bounded.
  const offsets = [];
  for (const dir of [1, -1]) {
    let empty = 0;
    for (let i = dir > 0 ? 0 : -1; Math.abs(i) <= 60; i += dir) {
      const wk = await get(`/api/weekly?offset=${i}`);
      await save(`weekly/${i}`, wk);
      offsets.push(i);
      empty = (wk.matches || []).length === 0 ? empty + 1 : 0;
      if (empty >= 6) break;
    }
  }

  // ---- per-role portal payloads ----------------------------------------
  const portals = {};
  for (const acct of demoAccounts.accounts) {
    const { token, user } = await login(acct.email);
    const payload = { user, documents: await get('/api/me/documents', token) };
    if (user.role === 'referee') payload.assignments = await get('/api/me/assignments', token);
    if (user.role === 'coach') payload.dashboard = await get('/api/coach/dashboard', token);
    if (user.role === 'player') payload.dashboard = await get('/api/player/dashboard', token);
    if (user.role === 'admin') {
      payload.admin = {
        overview: await get('/api/admin/overview', token),
        registrations: await get('/api/admin/registrations', token),
        documents: await get('/api/admin/documents?status=pending', token),
        users: await get('/api/admin/users', token),
      };
    }
    await save(`portal/${user.role}`, payload);
    portals[acct.email] = user.role;
  }

  await save('manifest', {
    bakedAt: new Date().toISOString(),
    counts: { divisions: divisions.length, teams: teams.length, cups: cups.length, referees: referees.length, weeks: offsets.length },
    portals,
  });

  console.log(`baked ${written} files, ${(bytes / 1024).toFixed(0)} KB -> client/public/data`);
} finally {
  server.kill();
}
