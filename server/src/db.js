import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, 'nmsl.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS divisions (
      id         INTEGER PRIMARY KEY,
      slug       TEXT UNIQUE NOT NULL,
      name       TEXT NOT NULL,
      season     TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS fields (
      id       INTEGER PRIMARY KEY,
      slug     TEXT UNIQUE NOT NULL,
      name     TEXT NOT NULL,
      address  TEXT DEFAULT '',
      city     TEXT DEFAULT 'Northlake',
      surface  TEXT DEFAULT 'Turf',
      lights   INTEGER DEFAULT 0,
      notes    TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS teams (
      id            INTEGER PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      club          TEXT DEFAULT '',
      division_id   INTEGER REFERENCES divisions(id),
      color         TEXT NOT NULL DEFAULT '#0b3d2e',
      coach         TEXT DEFAULT '',
      home_field_id INTEGER REFERENCES fields(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id           INTEGER PRIMARY KEY,
      division_id  INTEGER REFERENCES divisions(id),
      round        INTEGER NOT NULL DEFAULT 1,
      kickoff      TEXT NOT NULL,
      field_id     INTEGER REFERENCES fields(id),
      home_team_id INTEGER REFERENCES teams(id),
      away_team_id INTEGER REFERENCES teams(id),
      home_score   INTEGER,
      away_score   INTEGER,
      status       TEXT NOT NULL DEFAULT 'scheduled',
      notes        TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS cups (
      id          INTEGER PRIMARY KEY,
      slug        TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      season      TEXT NOT NULL,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS cup_matches (
      id           INTEGER PRIMARY KEY,
      cup_id       INTEGER REFERENCES cups(id),
      round_name   TEXT NOT NULL,
      round_order  INTEGER NOT NULL DEFAULT 0,
      slot         INTEGER NOT NULL DEFAULT 0,
      kickoff      TEXT,
      field_id     INTEGER REFERENCES fields(id),
      home_team_id INTEGER REFERENCES teams(id),
      away_team_id INTEGER REFERENCES teams(id),
      home_label   TEXT,
      away_label   TEXT,
      home_score   INTEGER,
      away_score   INTEGER,
      status       TEXT NOT NULL DEFAULT 'scheduled'
    );

    CREATE TABLE IF NOT EXISTS discipline (
      id            INTEGER PRIMARY KEY,
      player_name   TEXT NOT NULL,
      team_id       INTEGER REFERENCES teams(id),
      offense       TEXT NOT NULL,
      sanction      TEXT NOT NULL,
      games         INTEGER DEFAULT 0,
      incident_date TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'Active',
      notes         TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS news (
      id        INTEGER PRIMARY KEY,
      ref       INTEGER,
      category  TEXT NOT NULL DEFAULT 'news',
      title     TEXT NOT NULL,
      body      TEXT NOT NULL,
      posted_at TEXT NOT NULL,
      pinned    INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS referees (
      id     INTEGER PRIMARY KEY,
      slug   TEXT UNIQUE NOT NULL,
      name   TEXT NOT NULL,
      email  TEXT DEFAULT '',
      phone  TEXT DEFAULT '',
      grade  TEXT DEFAULT 'Regional',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id           INTEGER PRIMARY KEY,
      match_id     INTEGER REFERENCES matches(id),
      referee_id   INTEGER REFERENCES referees(id),
      role         TEXT NOT NULL DEFAULT 'Referee',
      status       TEXT NOT NULL DEFAULT 'invited',
      invited_at   TEXT,
      responded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS game_reports (
      id           INTEGER PRIMARY KEY,
      match_id     INTEGER UNIQUE REFERENCES matches(id),
      referee_id   INTEGER REFERENCES referees(id),
      home_score   INTEGER NOT NULL,
      away_score   INTEGER NOT NULL,
      abandoned    INTEGER DEFAULT 0,
      notes        TEXT DEFAULT '',
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_cards (
      id          INTEGER PRIMARY KEY,
      report_id   INTEGER REFERENCES game_reports(id),
      team_id     INTEGER REFERENCES teams(id),
      player_name TEXT NOT NULL,
      card        TEXT NOT NULL,
      minute      INTEGER,
      reason      TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS players (
      id           INTEGER PRIMARY KEY,
      team_id      INTEGER REFERENCES teams(id),
      slug         TEXT,
      name         TEXT NOT NULL,
      jersey       INTEGER,
      position     TEXT DEFAULT 'MF',
      birth_year   INTEGER,
      appearances  INTEGER DEFAULT 0,
      goals        INTEGER DEFAULT 0,
      assists      INTEGER DEFAULT 0,
      yellow_cards INTEGER DEFAULT 0,
      red_cards    INTEGER DEFAULT 0,
      status       TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role          TEXT NOT NULL,
      name          TEXT NOT NULL,
      phone         TEXT DEFAULT '',
      status        TEXT NOT NULL DEFAULT 'active',
      referee_id    INTEGER REFERENCES referees(id),
      team_id       INTEGER REFERENCES teams(id),
      player_id     INTEGER REFERENCES players(id),
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY,
      token      TEXT UNIQUE NOT NULL,
      user_id    INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id           INTEGER PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id),
      category     TEXT DEFAULT 'general',
      type         TEXT NOT NULL,
      title        TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending',
      submitted_at TEXT NOT NULL,
      reviewed_at  TEXT,
      reviewed_by  INTEGER REFERENCES users(id),
      notes        TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_assign_ref ON assignments(referee_id);
    CREATE INDEX IF NOT EXISTS idx_assign_match ON assignments(match_id);
    CREATE INDEX IF NOT EXISTS idx_cards_report ON report_cards(report_id);
    CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_docs_user ON documents(user_id);
  `);
}

export function isEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM divisions').get();
  return row.n === 0;
}
