import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useApi } from '../../api.js';
import { Spinner, ErrorBox, Crest, Empty, MatchRow } from '../../components/ui.jsx';
import { StatTiles, DocumentsPanel } from '../../components/portal.jsx';

const COACH_DOCS = ['Coaching License', 'Criminal Record Check (CRC)', 'First Aid Certificate', 'Team Roster Sheet', 'Concussion Awareness'];

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const { data, loading, error } = useApi('/coach/dashboard');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  const { team, position, roster, upcoming, recent } = data;
  const totalGoals = roster.reduce((s, p) => s + p.goals, 0);

  return (
    <div className="section-gap">
      <PortalHeader eyebrow="Coach Portal" title={team.name} subtitle={`${team.division} · ${team.club}`}
        color={team.color} user={user} onLogout={logout} />

      <StatTiles items={[
        { n: position ? `#${position.rank}` : '—', k: 'League Position' },
        { n: position ? `${position.pts}` : '—', k: 'Points' },
        { n: roster.length, k: 'Squad Size' },
        { n: totalGoals, k: 'Goals Scored' },
      ]} />

      <section className="card">
        <div className="card-head">
          <h3>Squad &amp; Player Stats</h3>
          <Link to={`/teams/${team.slug}`} className="linklike" style={{ fontSize: 13 }}>Public team page →</Link>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th><th className="l">Player</th><th>Pos</th>
                <th>Apps</th><th>G</th><th>A</th><th>🟨</th><th>🟥</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p) => (
                <tr key={p.id}>
                  <td className="rank">{p.jersey}</td>
                  <td className="l" style={{ fontWeight: 600 }}>{p.name}{p.status === 'pending' && <span className="tag amber" style={{ marginLeft: 8 }}>Pending</span>}</td>
                  <td className="muted">{p.position}</td>
                  <td>{p.appearances}</td>
                  <td style={{ fontWeight: 700 }}>{p.goals}</td>
                  <td>{p.assists}</td>
                  <td>{p.yellow_cards}</td>
                  <td>{p.red_cards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-2" style={{ gap: 20 }}>
        <section className="card">
          <div className="card-head"><h3>Upcoming Fixtures</h3></div>
          {upcoming.length === 0 ? <Empty>No upcoming fixtures.</Empty> : upcoming.map((m) => <MatchRow key={m.id} m={m} showDivision />)}
        </section>
        <section className="card">
          <div className="card-head"><h3>Recent Results</h3></div>
          {recent.length === 0 ? <Empty>No results yet.</Empty> : recent.map((m) => <MatchRow key={m.id} m={m} showDivision />)}
        </section>
      </div>

      <DocumentsPanel presetTypes={COACH_DOCS} title="My Coaching Documents" />
    </div>
  );
}

export function PortalHeader({ eyebrow, title, subtitle, color, user, onLogout }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 22, background: 'linear-gradient(100deg, rgba(15,81,50,.10), transparent)' }}>
        <Crest name={title} color={color || '#0f5132'} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="eyebrow">{eyebrow}</span>
          <h2 style={{ fontSize: 24, margin: '2px 0' }}>{title}</h2>
          <div className="muted" style={{ fontSize: 13.5 }}>{subtitle}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 12.5 }}>{user?.email}</div>
          <button className="btn btn-sm" onClick={onLogout} style={{ marginTop: 6 }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
