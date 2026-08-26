import { useEffect, useState } from 'react';
import { staticGet, staticPost } from './staticApi.js';

// The site deploys as static files with no backend, so requests are answered
// from the baked snapshot in /data by default. Set VITE_API_MODE=live to run
// against the Express API instead — needed when changing endpoints, before
// re-baking with `npm run bake`.
const LIVE = import.meta.env.VITE_API_MODE === 'live';

const TOKEN_KEY = 'nmsl.token';

// Storage can be unavailable or throw outright — private windows, blocked
// cookies, embedded webviews. This runs at module scope, so an unguarded read
// would fail before React ever mounts and leave a blank page with no error.
// Guarded, the worst case is simply not remembering a session.
const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* unavailable */ } },
  remove(k) { try { localStorage.removeItem(k); } catch { /* unavailable */ } },
};

let authToken = storage.get(TOKEN_KEY) || null;

export function setAuthToken(token) {
  authToken = token || null;
  if (token) storage.set(TOKEN_KEY, token);
  else storage.remove(TOKEN_KEY);
}
export function getAuthToken() {
  return authToken;
}

function authHeaders(extra = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

export async function apiGet(path) {
  if (!LIVE) return staticGet(path);
  const res = await fetch(`/api${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function apiPost(path, body, method = 'POST') {
  if (!LIVE) return staticPost(path, body, method);
  const res = await fetch(`/api${path}`, {
    method,
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Errors worth retrying: a network-level failure (no status attached), or an
// origin that is up but not ready. Render's free plan answers 502/503 while
// the container boots, so these are exactly the cold-start responses.
function isRetriable(err) {
  if (err.status == null) return true;
  return [408, 502, 503, 504].includes(err.status);
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// Small data-fetching hook. `path` may be null to skip fetching.
//
// The API runs on Render's free plan, which spins the container down after
// ~15 minutes idle; the next request then fails for the 30-60s it takes to
// boot. Previously that left the panel blank until the visitor refreshed by
// hand, so a failed GET is retried with backoff (~40s of cover) and `waking`
// is exposed so the UI can explain the wait instead of showing nothing.
// Only GETs run through this hook, so retrying is always safe.
export function useApi(path, deps = []) {
  const [state, setState] = useState({
    data: null, loading: true, error: null, waking: false,
  });

  useEffect(() => {
    let alive = true;
    if (path == null) {
      setState({
        data: null, loading: false, error: null, waking: false,
      });
      return undefined;
    }
    setState((s) => ({
      ...s, loading: true, error: null, waking: false,
    }));

    const MAX_ATTEMPTS = 7;
    (async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        try {
          const data = await apiGet(path);
          if (alive) {
            setState({
              data, loading: false, error: null, waking: false,
            });
          }
          return;
        } catch (err) {
          if (!alive) return;
          if (!isRetriable(err) || attempt === MAX_ATTEMPTS - 1) {
            setState({
              data: null, loading: false, error: err.message, waking: false,
            });
            return;
          }
          setState((s) => ({ ...s, waking: true }));
          // eslint-disable-next-line no-await-in-loop
          await sleep(Math.min(1500 * (2 ** attempt), 10000));
        }
      }
    })();

    return () => { alive = false; };
    // `path` is tracked alongside the caller's deps, so a route change always
    // refetches even if a caller forgets to list it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  return state;
}
