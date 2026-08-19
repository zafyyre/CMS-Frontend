import { useApi } from '../api.js';
import { Spinner, ErrorBox } from '../components/ui.jsx';

export default function Fields() {
  const { data, loading, error, waking } = useApi('/fields');
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Venues</span>
        <h2>Fields</h2>
        <p>Where the league plays. Confirm playability with your club before travelling — grass pitches may close in poor weather.</p>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        <div className="grid grid-3">
          {data.map((f) => (
            <div key={f.id} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                <h3 style={{ fontSize: 16 }}>{f.name}</h3>
                <span className={`tag ${f.surface === 'Turf' ? 'green' : 'amber'}`}>{f.surface}</span>
              </div>
              <div className="muted" style={{ fontSize: 13.5, margin: '8px 0' }}>
                {f.address}<br />{f.city}, BC
              </div>
              <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>{f.notes}</p>
              <div className="divider" />
              <div style={{ display: 'flex', gap: 14, fontSize: 12.5 }} className="muted">
                <span>{f.lights ? '💡 Lit' : '☀️ Daytime only'}</span>
                <span>· {f.team_count} home {f.team_count === 1 ? 'team' : 'teams'}</span>
              </div>
              <a
                className="btn btn-sm"
                style={{ marginTop: 12 }}
                href={`https://www.google.com/maps/search/${encodeURIComponent(`${f.name} ${f.address} ${f.city} BC`)}`}
                target="_blank"
                rel="noreferrer"
              >
                📍 Open in Maps
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
