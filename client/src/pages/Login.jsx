import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApi } from '../api.js';
import { RoleBadge } from '../components/portal.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const demo = useApi('/auth/demo-accounts');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/portal" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await login(email.trim(), password);
      navigate('/portal');
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  const fill = (a) => { setEmail(a.email); setPassword(demo.data.password); setErr(null); };

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Member Login</span>
        <h2>Sign in to your portal</h2>
        <p>Administrators, coaches, players and referees each get their own dashboard. New player?{' '}
          <Link to="/register" className="linklike">Create an account</Link>.
        </p>
      </div>

      <div className="grid grid-side" style={{ gap: 20 }}>
        <form className="card card-pad" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Email</span>
            <input className="input" type="email" autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Password</span>
            <input className="input" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          {err && <div className="error-box">{err}</div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <aside className="card card-pad" style={{ background: 'var(--surface-2)' }}>
          <h3 style={{ fontSize: 15 }}>🔑 Demo accounts</h3>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 14px' }}>
            Click any role to fill the form, then Sign in. Password: <code>{demo.data?.password || 'demo1234'}</code>
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {(demo.data?.accounts || []).map((a) => (
              <button key={a.email} type="button" className="card" onClick={() => fill(a)}
                style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                <RoleBadge role={a.role} />
                <span style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{a.email}</span>
                  <br /><span className="muted">{a.label}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
