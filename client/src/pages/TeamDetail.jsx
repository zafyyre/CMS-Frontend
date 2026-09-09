import { Link, useParams } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, Crest, TeamInline } from '../components/ui.jsx';
import { fmtDay, fmtTime } from '../format.js';

export default function TeamDetail() {
  const { slug } = useParams();
  const { data, loading, error, waking } = useApi(`/teams/${slug}`, [slug]);
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  const { team, position, matches } = data;
  const played = matches.filter((m) => m.status === 'final');
  const upcoming = matches.filter((m) => m.status !== 'final');
  const form = played.slice(-5).map((m) => m.result);

  return (
    <div className="section-gap">
      <div>
        <Link to="/teams" className="linklike" style={{ fontSize: 13 }}>← All teams</Link>
      </div>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: 24, background: `linear-gradient(100deg, ${team.color}14, transparent)` }}>
          <Crest name={team.name} color={team.color} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="eyebrow">{team.division_name}</span>
            <h2 style={{ fontSize: 28, margin: '4px 0' }}>{team.name}</h2>
            <div className="muted" style={{ fontSize: 14 }}>
              {team.club && <>Club: {team.club} · </>}
              Coach: {team.coach || 'TBA'}
              {team.field_name && <> · Home: {team.field_name}</>}
            </div>
          </div>
        </div>
        {position && (
          <div className="grid grid-4" style={{ padding: 20, gap: 0, borderTop: '1px solid var(--border)' }}>
            <MiniStat n={`#${position.rank}`} k="Position" />
            <MiniStat n={position.pts} k="Points" />
            <MiniStat n={`${position.w}-${position.d}-${position.l}`} k="W–D–L" />
            <MiniStat n={`${position.gf}:${position.ga}`} k="Goals F:A" />
          </div>
        )}
      </section>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><h3>Upcoming Fixtures</h3><span className="tag blue">{upcoming.length}</span></div>
          {upcoming.length === 0 ? <div className="empty">Season complete — no fixtures left.</div> : (
            <ul className="list-reset">
              {upcoming.map((m) => <FixtureLine key={m.id} m={m} team={team} />)}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Results &amp; Form</h3>
            <span className="form-row">
              {form.map((r, i) => <span key={i} className={`form-pill ${r}`}>{r}</span>)}
            </span>
          </div>
          {played.length === 0 ? <div className="empty">No results yet.</div> : (
            <ul className="list-reset">
              {[...played].reverse().map((m) => <ResultLine key={m.id} m={m} team={team} />)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ n, k }) {
  return (
    <div style={{ textAlign: 'center', padding: '6px 0' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--pitch-700)' }}>{n}</div>
      <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
    </div>
  );
}

function opponent(m, team) {
  return m.home.slug === team.slug ? m.away : m.home;
}

function FixtureLine({ m, team }) {
  const opp = opponent(m, team);
  const isHome = m.home.slug === team.slug;
  return (
    <li className="fixture-line">
      <div className="when">
        <strong>{fmtDay(m.kickoff)}</strong>
        <span className="muted">{fmtTime(m.kickoff)}</span>
      </div>
      <span className="tag">{isHome ? 'H' : 'A'}</span>
      <div className="who"><TeamInline team={opp} /></div>
      <span className="where">{m.field ? m.field.name : 'TBD'}</span>
    </li>
  );
}

function ResultLine({ m, team }) {
  const opp = opponent(m, team);
  const isHome = m.home.slug === team.slug;
  const gf = isHome ? m.home.score : m.away.score;
  const ga = isHome ? m.away.score : m.home.score;
  const cls = m.result === 'W' ? 'green' : m.result === 'L' ? 'red' : 'amber';
  return (
    <li className="fixture-line">
      <div className="when">
        <strong>{fmtDay(m.kickoff)}</strong>
        <span className="muted">{isHome ? 'Home' : 'Away'}</span>
      </div>
      <span className={`tag ${cls}`} style={{ fontWeight: 800 }}>{m.result}</span>
      <div className="who"><TeamInline team={opp} /></div>
      <span className="outcome">{gf}–{ga}</span>
    </li>
  );
}
