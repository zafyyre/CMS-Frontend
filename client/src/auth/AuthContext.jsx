import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, setAuthToken, getAuthToken } from '../api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getAuthToken());

  // Resolve an existing token on first load
  useEffect(() => {
    if (!getAuthToken()) { setLoading(false); return; }
    let alive = true;
    apiGet('/auth/me')
      .then((d) => {
        if (!alive) return;
        // A null user means the token is stale/expired — drop it so it isn't
        // left in storage and re-sent on every request.
        if (d.user) setUser(d.user);
        else { setAuthToken(null); setUser(null); }
      })
      .catch(() => { if (alive) { setAuthToken(null); setUser(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await apiPost('/auth/login', { email, password });
    setAuthToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (payload) => {
    const d = await apiPost('/auth/register', payload);
    setAuthToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await apiPost('/auth/logout', {}); } catch { /* ignore */ }
    setAuthToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const d = await apiGet('/auth/me');
    setUser(d.user);
    return d.user;
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
