# Northlake Metro Soccer League — League Management Platform

A full-stack amateur-soccer league platform: a public league site plus role-based member portals.

> **All data in this project is fictional sample data.** The Northlake Metro Soccer League is not a real
> organization. Every club, venue, official, player, result and disciplinary record is invented for
> demonstration purposes.

Standings are **computed live from match results** (3 pts win / 1 pt draw), schedules are filterable by division and week, and every team links through to its own fixtures, results and form.

It also includes **role-based member portals** behind a real login. Four roles each get their own dashboard:

- **Administrator** — league-wide overview; approve/reject player registrations; review submitted documents; browse all accounts.
- **Coach** — team position & points, full squad with per-player stats, fixtures/results, and coaching-document uploads.
- **Player** — personal stats, registration status, team schedule, and registration-document uploads. New players self-register (pending admin approval).
- **Referee** — accept game invitations, see upcoming/past assignments, and file match reports. Filing a report confirms the result (feeding the live standings) and any send-off (red card) automatically opens a discipline case.

### Demo logins (password `demo1234`)

| Role | Email |
|------|-------|
| Admin | `admin@nmsl.example` |
| Coach | `coach@nmsl.example` |
| Player | `player@nmsl.example` |
| Referee | `referee@nmsl.example` |

The login screen lists these with one-click fill. Or register a brand-new player at `/register`.

> **Security note:** auth is demo-grade — scrypt-hashed passwords + opaque session tokens (Bearer), role-guarded endpoints. Not production-hardened (no HTTPS/CSRF/rate-limiting/refresh-token rotation), demo accounts share a password, and "documents" are metadata records (no real file bytes are stored). A production build would add encrypted file storage and full session hardening.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + Vite + React Router, hand-crafted CSS design system |
| Backend  | Node.js + Express REST API |
| Database | SQLite via Node's built-in `node:sqlite` (zero native deps) |

## Getting started

```bash
npm install        # installs both workspaces (server + client)
npm run dev        # starts the API (:4000) and the web app (:5173)
```

Then open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the
Express backend, and the database is **auto-seeded on first run**.

Other scripts:

```bash
npm run seed       # re-generate the sample database
npm run build      # production build of the client
```

## Project layout

```
server/            Express API + SQLite
  src/db.js        schema + connection (node:sqlite)
  src/seed.js      generates divisions, teams, a full round-robin schedule
                   (deterministic results), referees, assignments, historical
                   game reports, cups, discipline & news — all fictional
  src/index.js     REST endpoints; standings computed from results
  src/auth.js      scrypt hashing, session tokens, user resolver + guards
client/            React single-page app
  src/pages/       public pages + Login, Register, Portal (role router)
  src/pages/dash/  Admin / Coach / Player dashboards
  src/auth/        AuthContext (token, login/logout/register/me)
  src/components/  Layout (auth-aware nav) + shared UI + portal widgets
  src/index.css    design system
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/summary` | Homepage: stats, upcoming, results, latest news, Premier top 5 |
| `GET /api/divisions` | All divisions |
| `GET /api/divisions/:slug` | Division + **computed standings** + rounds |
| `GET /api/divisions/:slug/matches` | Division fixtures/results (`?round=`) |
| `GET /api/schedule` | Cross-division schedule (`?division= &team= &status= &field=`) |
| `GET /api/weekly?offset=` | Matches for a Sat–Fri week, navigable |
| `GET /api/teams` / `:slug` | Team directory / team detail with form |
| `GET /api/cups` / `:slug` | Cup list / bracket by round |
| `GET /api/discipline?status=` | Suspensions & hearings |
| `GET /api/news?category=` | News & notices |
| `GET /api/referees` | Officials directory (games / reports counts) |
| `POST /api/assignments/:id/respond` | Accept or decline an assignment (referee/admin) |
| `POST /api/assignments/:id/report` | File a game report → confirms result, opens discipline for reds |

### Auth & role endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` · `/logout` · `GET /auth/me` | Session auth (Bearer token) |
| `POST /api/auth/register` | Player self-registration (creates a pending account) |
| `GET /api/auth/demo-accounts` | Curated demo logins for the sign-in screen |
| `GET/POST /api/me/documents` | List / submit the signed-in user's documents |
| `GET /api/me/assignments` | Signed-in referee's invitations / upcoming / past |
| `GET /api/coach/dashboard` | Coach: team, squad stats, fixtures, documents |
| `GET /api/player/dashboard` | Player: profile, stats, team schedule, documents |
| `GET /api/admin/overview` | Admin: league-wide counts |
| `GET /api/admin/registrations` · `POST /admin/users/:id/status` | Review pending registrations |
| `GET /api/admin/documents` · `POST /admin/documents/:id/review` | Review submitted documents |
| `GET /api/admin/users` | All accounts (searchable, role-filtered) |
