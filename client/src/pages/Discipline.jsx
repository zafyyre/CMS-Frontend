import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, Empty } from '../components/ui.jsx';
import { fmtDateLong } from '../format.js';

const STATUSES = ['All', 'Active', 'Pending Hearing', 'Served'];
const statusClass = { Active: 'red', 'Pending Hearing': 'amber', Served: 'green' };

export default function Discipline() {
  const [status, setStatus] = useState('All');
  const path = status === 'All' ? '/discipline' : `/discipline?status=${encodeURIComponent(status)}`;
  const { data, loading, error, waking } = useApi(path, [status]);
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Discipline</span>
        <h2>Suspensions &amp; Hearings</h2>
        <p>Current suspensions and pending hearings across the league. All discipline hearings are held by videoconference (Zoom); affected clubs are notified by email.</p>
      </div>

      <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
        <strong>ℹ️ Reminder:</strong> <span className="muted">A player serving a suspension may not play, coach or manage in any league fixture until the sanction is complete. Suspensions carry over to cup competitions.</span>
      </div>

      <div className="chip-row">
        {STATUSES.map((s) => (
          <button key={s} className={`chip${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        !data || data.length === 0 ? <Empty>No records for this filter.</Empty> : (
          <div className="card table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="l">Player</th>
                  <th className="l">Team</th>
                  <th className="l">Offense</th>
                  <th>Sanction</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id}>
                    <td className="l" style={{ fontWeight: 600 }}>{d.player_name}</td>
                    <td className="l">
                      {d.team_slug ? <Link to={`/teams/${d.team_slug}`} className="linklike">{d.team_name}</Link> : d.team_name || '—'}
                    </td>
                    <td className="l">{d.offense}</td>
                    <td>{d.sanction}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{fmtDateLong(d.incident_date)}</td>
                    <td><span className={`tag ${statusClass[d.status] || ''}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
