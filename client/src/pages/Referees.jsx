import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, Crest } from '../components/ui.jsx';

const gradeClass = { Provincial: 'green', Regional: 'blue', District: 'amber' };

export default function Referees() {
  const { data, loading, error, waking } = useApi('/referees');
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Match Officials</span>
        <h2>Referees</h2>
        <p>The officials who keep the league running. Referees manage their own games — accepting assignments and filing match reports — through the Referee Portal.</p>
      </div>

      <div className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--surface-2)' }}>
        <div>
          <h3 style={{ fontSize: 17 }}>Are you an official?</h3>
          <p className="muted" style={{ margin: '4px 0 0' }}>Accept your game invitations and submit reports from your dashboard.</p>
        </div>
        <Link to="/referee" className="btn btn-primary">Open Referee Portal →</Link>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        <div className="grid grid-3">
          {data.map((r) => (
            <div key={r.id} className="card card-pad" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Crest name={r.name} color="#0f4574" size="lg" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>{r.name}</div>
                <span className={`tag ${gradeClass[r.grade] || ''}`} style={{ marginTop: 4 }}>{r.grade}</span>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                  {r.games} games officiated · {r.reports} reports filed
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
