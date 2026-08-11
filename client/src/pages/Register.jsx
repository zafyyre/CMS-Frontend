import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApi } from '../api.js';
import { Spinner } from '../components/ui.jsx';

const POSITIONS = [['GK', 'Goalkeeper'], ['DF', 'Defender'], ['MF', 'Midfielder'], ['FW', 'Forward']];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const teams = useApi('/teams');
  const [form, setForm] = useState({ name: '', email: '', password: '', team_id: '', position: 'MF' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Group teams by division for the select
  const grouped = useMemo(() => {
    const g = {};
    for (const t of teams.data || []) (g[t.division_name] ||= []).push(t);
    return g;
  }, [teams.data]);

  if (user) return <Navigate to="/portal" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await register({ ...form, team_id: Number(form.team_id) });
      navigate('/portal');
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Player Registration</span>
        <h2>Create your player account</h2>
        <p>Register with your club, then upload your documents. The league office reviews every registration before it’s activated.
          Already have an account? <Link to="/login" className="linklike">Sign in</Link>.
        </p>
      </div>

      {teams.loading ? <Spinner /> : (
        <form className="card card-pad" onSubmit={submit} style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Full name</span>
            <input className="input" value={form.name} onChange={set('name')} placeholder="First and last name" required />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Email</span>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Password</span>
            <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required />
          </label>
          <div className="grid grid-2" style={{ gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Team</span>
              <select className="input" value={form.team_id} onChange={set('team_id')} required>
                <option value="">Select your team…</option>
                {Object.entries(grouped).map(([div, list]) => (
                  <optgroup key={div} label={div}>
                    {list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Position</span>
              <select className="input" value={form.position} onChange={set('position')}>
                {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          {err && <div className="error-box">{err}</div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            By registering you agree to the league’s code of conduct. Your account stays <strong>pending</strong> until the registrar approves it.
          </p>
        </form>
      )}
    </div>
  );
}
