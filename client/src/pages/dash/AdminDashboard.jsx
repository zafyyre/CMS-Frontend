import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useApi, apiPost } from '../../api.js';
import { Spinner, ErrorBox, Empty } from '../../components/ui.jsx';
import { StatTiles, StatusBadge, RoleBadge, Tabs } from '../../components/portal.jsx';
import { PortalHeader } from './CoachDashboard.jsx';
import { fmtDateLong } from '../../format.js';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const overview = useApi('/admin/overview', [refreshKey]);
  const bump = () => setRefreshKey((k) => k + 1);
  const o = overview.data;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'registrations', label: 'Registrations', count: o?.pendingRegistrations },
    { key: 'documents', label: 'Documents', count: o?.pendingDocuments },
    { key: 'users', label: 'Users' },
  ];

  return (
    <div className="section-gap">
      <PortalHeader eyebrow="Admin Portal" title={user.name} subtitle="League administration · full access"
        user={user} onLogout={logout} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && <Overview overview={overview} />}
      {tab === 'registrations' && <Registrations onMutate={bump} />}
      {tab === 'documents' && <Documents onMutate={bump} />}
      {tab === 'users' && <Users />}
    </div>
  );
}

function Overview({ overview }) {
  if (overview.loading) return <Spinner />;
  if (overview.error) return <ErrorBox message={overview.error} />;
  const o = overview.data;
  return (
    <div className="section-gap">
      <StatTiles items={[
        { n: o.pendingRegistrations, k: 'Pending Registrations' },
        { n: o.pendingDocuments, k: 'Documents to Review' },
        { n: o.openDiscipline, k: 'Open Discipline' },
        { n: o.awaitingReports, k: 'Reports Outstanding' },
      ]} />
      <section className="card card-pad">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>League Accounts</h3>
        <div className="grid grid-4">
          {['admin', 'coach', 'player', 'referee'].map((r) => (
            <div key={r} className="stat">
              <div className="n">{o.usersByRole?.[r] || 0}</div>
              <div className="k">{r}s</div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          {o.users} total accounts · {o.teams} teams · {o.players} registered players. This is sensitive member
          data — visible to administrators only.
        </p>
      </section>
    </div>
  );
}

function ActionError({ msg }) {
  return msg ? <div className="error-box" style={{ marginTop: 10 }}>{msg}</div> : null;
}

function Registrations({ onMutate }) {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useApi('/admin/registrations', [tick]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(0);

  const act = async (id, action) => {
    setBusy(id); setErr(null);
    try { await apiPost(`/admin/users/${id}/status`, { action }); setTick((t) => t + 1); onMutate?.(); }
    catch (e) { setErr(e.message); } finally { setBusy(0); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  return (
    <section className="card">
      <div className="card-head">
        <h3>New Player Registrations</h3>
        <span className="tag amber">{data.length} awaiting review</span>
      </div>
      <ActionError msg={err} />
      {data.length === 0 ? <Empty>No registrations awaiting approval. 🎉</Empty> : (
        <ul className="list-reset">
          {data.map((r) => (
            <li key={r.id} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{r.name} <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {r.email}</span></div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {r.team_name || 'No team'} · {r.position || '—'} · {r.documents} document{r.documents === 1 ? '' : 's'} · applied {fmtDateLong(r.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>✓ Approve</button>
                <button className="btn btn-sm" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Documents({ onMutate }) {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useApi('/admin/documents?status=pending', [tick]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(0);

  const review = async (id, action) => {
    setBusy(id); setErr(null);
    try { await apiPost(`/admin/documents/${id}/review`, { action }); setTick((t) => t + 1); onMutate?.(); }
    catch (e) { setErr(e.message); } finally { setBusy(0); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  return (
    <section className="card">
      <div className="card-head">
        <h3>Documents Awaiting Review</h3>
        <span className="tag amber">{data.length} pending</span>
      </div>
      <ActionError msg={err} />
      {data.length === 0 ? <Empty>Nothing to review — all caught up. 🎉</Empty> : (
        <ul className="list-reset">
          {data.map((d) => (
            <li key={d.id} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span aria-hidden style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{d.type} <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>· {d.title}</span></div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <RoleBadge role={d.owner.role} /> {d.owner.name} · {d.owner.email} · {fmtDateLong(d.submitted_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => review(d.id, 'approve')}>✓ Approve</button>
                <button className="btn btn-sm" disabled={busy === d.id} onClick={() => review(d.id, 'reject')}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ROLE_FILTERS = [['', 'All'], ['admin', 'Admins'], ['coach', 'Coaches'], ['player', 'Players'], ['referee', 'Referees']];

function Users() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [role, setRole] = useState('');
  // Debounce the search box so we fetch once the user pauses, not per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);
  const params = new URLSearchParams();
  if (debouncedQ) params.set('q', debouncedQ);
  if (role) params.set('role', role);
  const { data, loading, error } = useApi(`/admin/users?${params.toString()}`, [debouncedQ, role]);

  return (
    <section className="card">
      <div className="card-head">
        <h3>All Accounts</h3>
        <input className="input" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
      </div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="chip-row">
          {ROLE_FILTERS.map(([v, l]) => (
            <button key={v} className={`chip${role === v ? ' active' : ''}`} onClick={() => setRole(v)}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : data.length === 0 ? <Empty>No accounts match.</Empty> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th className="l">Name</th><th className="l">Email</th><th>Role</th><th>Status</th><th className="l">Linked to</th></tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id}>
                  <td className="l" style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="l muted">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td className="l muted">{u.linkedTo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="muted" style={{ fontSize: 12.5, padding: '10px 16px' }}>Showing up to 500 accounts.</div>
    </section>
  );
}
