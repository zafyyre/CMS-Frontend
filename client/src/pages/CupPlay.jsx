import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, Crest } from '../components/ui.jsx';
import { fmtDay, fmtTime } from '../format.js';

export default function CupPlay() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: cups } = useApi('/cups');
  const active = slug || (cups && cups[0] && cups[0].slug);
  const { data, loading, error, waking } = useApi(active ? `/cups/${active}` : null, [active]);
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Knockout Competitions</span>
        <h2>Cup Play</h2>
        <p>Follow the league’s knockout cups round by round — from the early ties through to the final.</p>
      </div>

      <div className="chip-row">
        {(cups || []).map((c) => (
          <button key={c.slug} className={`chip${c.slug === active ? ' active' : ''}`} onClick={() => navigate(`/cups/${c.slug}`)}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : data && (
        <>
          <div className="card card-pad">
            <h3 style={{ fontSize: 18 }}>{data.cup.name} <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>· {data.cup.season}</span></h3>
            <p className="muted" style={{ margin: '6px 0 0' }}>{data.cup.description}</p>
          </div>

          <div className="table-wrap">
            <div style={{ display: 'flex', gap: 18, minWidth: 'min-content', paddingBottom: 8 }}>
              {data.rounds.map((rd) => (
                <div key={rd.name} style={{ flex: '1 0 280px', minWidth: 280 }}>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 12.5, color: 'var(--pitch-700)', marginBottom: 10 }}>
                    {rd.name}
                  </div>
                  <div className="section-gap" style={{ display: 'grid', gap: 12 }}>
                    {rd.matches.map((m) => <CupCard key={m.id} m={m} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Side({ side, winner }) {
  if (side.label) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.7 }}>
        <span className="crest" style={{ background: '#c3ccc6' }}>?</span>
        <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>{side.label}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
      <Link to={`/teams/${side.slug}`} className="team-inline" style={{ fontWeight: winner ? 800 : 600 }}>
        <Crest name={side.name} color={side.color} />
        <span className="name">{side.name}</span>
      </Link>
      {side.score != null && <span style={{ fontWeight: 800, fontSize: 16 }}>{side.score}</span>}
    </div>
  );
}

function CupCard({ m }) {
  const final = m.status === 'final';
  const hs = m.home.score, as = m.away.score;
  const homeWin = final && hs > as;
  const awayWin = final && as > hs;
  return (
    <div className="card card-pad" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`tag ${final ? 'green' : 'blue'}`}>{final ? 'Full time' : 'Scheduled'}</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {m.kickoff ? `${fmtDay(m.kickoff)} · ${fmtTime(m.kickoff)}` : 'TBD'}
        </span>
      </div>
      <Side side={m.home} winner={homeWin} />
      <Side side={m.away} winner={awayWin} />
      {m.field && <div className="muted" style={{ fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>{m.field.name}, {m.field.city}</div>}
    </div>
  );
}
