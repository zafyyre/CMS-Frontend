import crypto from 'node:crypto';
import { db } from './db.js';

/* ------------------------------------------------------------------ *
 * Password hashing (scrypt — built into Node, no native deps)
 * ------------------------------------------------------------------ */

const KEYLEN = 32;
const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, KEYLEN, SCRYPT).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  let derived;
  try {
    derived = crypto.scryptSync(password, salt, KEYLEN, SCRYPT);
  } catch {
    return false;
  }
  const expected = Buffer.from(hash, 'hex');
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

/* ------------------------------------------------------------------ *
 * Sessions (opaque bearer tokens)
 * ------------------------------------------------------------------ */

const SESSION_DAYS = 30;

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 864e5);
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, userId, now.toISOString(), expires.toISOString());
  return token;
}

export function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function tokenFromReq(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

// Resolve the raw user row for a request, or null. Expired sessions are purged.
export function currentUser(req) {
  const token = tokenFromReq(req);
  if (!token) return null;
  const sess = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!sess) return null;
  if (sess.expires_at && new Date(sess.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sess.id);
    return null;
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(sess.user_id) || null;
}

/* ------------------------------------------------------------------ *
 * Public-safe user shape (never leaks password hash/salt)
 * ------------------------------------------------------------------ */

export function shapeUser(u) {
  if (!u) return null;
  const out = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    phone: u.phone || '',
    referee: null,
    team: null,
    player: null,
  };

  if (u.referee_id) {
    const r = db.prepare('SELECT id, slug, name, grade FROM referees WHERE id = ?').get(u.referee_id);
    if (r) out.referee = r;
  }
  if (u.team_id) {
    const t = db.prepare('SELECT id, slug, name, color FROM teams WHERE id = ?').get(u.team_id);
    if (t) out.team = t;
  }
  if (u.player_id) {
    const p = db.prepare(`
      SELECT p.id, p.slug, p.name, p.jersey, p.position, p.status,
             t.id team_id, t.slug team_slug, t.name team_name, t.color team_color,
             d.name division_name
      FROM players p
      LEFT JOIN teams t ON t.id = p.team_id
      LEFT JOIN divisions d ON d.id = t.division_id
      WHERE p.id = ?`).get(u.player_id);
    if (p) {
      out.player = {
        id: p.id, slug: p.slug, name: p.name, jersey: p.jersey, position: p.position, status: p.status,
        team: p.team_id ? { id: p.team_id, slug: p.team_slug, name: p.team_name, color: p.team_color, division: p.division_name } : null,
      };
    }
  }
  return out;
}
