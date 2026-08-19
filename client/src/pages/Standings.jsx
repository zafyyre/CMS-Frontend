import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, TeamInline, FormRow, MatchRow, Empty } from '../components/ui.jsx';

export default function Standings() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: divisions } = useApi('/divisions');
  const active = slug || 'premier';
  const [tab, setTab] = useState('table');

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Standings &amp; Schedule</span>
        <h2>League Tables</h2>
        <p>Tables are calculated live from match results — 3 points for a win, 1 for a draw. Pick a division to explore its table, fixtures and results.</p>
      </div>

      <div className="chip-row">
        {(divisions || []).map((d) => (
          <button
            key={d.slug}
            className={`chip${d.slug === active ? ' active' : ''}`}
            onClick={() => navigate(`/standings/${d.slug}`)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="chip-row" role="tablist">
        <button className={`chip${tab === 'table' ? ' active' : ''}`} onClick={() => setTab('table')}>Table</button>
        <button className={`chip${tab === 'matches' ? ' active' : ''}`} onClick={() => setTab('matches')}>Fixtures &amp; Results</button>
      </div>

      {tab === 'table' ? <TableView slug={active} /> : <MatchesView slug={active} />}
    </div>
  );
}

function TableView({ slug }) {
  const { data, loading, error, waking } = useApi(`/divisions/${slug}`, [slug]);
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;
  const { division, standings } = data;
  const n = standings.length;

  return (
    <div className="card">
      <div className="card-head">
        <h3>{division.name} · {division.season}</h3>
        <span className="muted" style={{ fontSize: 13 }}>{n} teams</span>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="rank">#</th>
              <th className="l">Team</th>
              <th>P</th><th>W</th><th>D</th><th>L</th>
              <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
              <th className="l">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((r) => {
              const zone = r.rank === 1 ? 'zone-promote' : r.rank === n ? 'zone-releg' : '';
              return (
                <tr key={r.team_id}>
                  <td className={`rank ${zone}`}>{r.rank}</td>
                  <td className="l"><TeamInline team={{ name: r.team, slug: r.slug, color: r.color }} /></td>
                  <td>{r.gp}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td>
                  <td>{r.gf}</td><td>{r.ga}</td>
                  <td style={{ fontWeight: 600 }}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                  <td className="pts">{r.pts}</td>
                  <td className="l"><FormRow form={r.form} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card-pad" style={{ paddingTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
        <span className="muted"><span className="form-pill W" style={{ display: 'inline-grid', verticalAlign: 'middle' }}>W</span> Win &nbsp;·&nbsp; <span className="form-pill D" style={{ display: 'inline-grid', verticalAlign: 'middle' }}>D</span> Draw &nbsp;·&nbsp; <span className="form-pill L" style={{ display: 'inline-grid', verticalAlign: 'middle' }}>L</span> Loss</span>
        <span className="muted">Green edge = division leader · Red edge = bottom</span>
      </div>
    </div>
  );
}

function MatchesView({ slug }) {
  const { data: meta } = useApi(`/divisions/${slug}`, [slug]);
  const [round, setRound] = useState('all');
  const path = round === 'all' ? `/divisions/${slug}/matches` : `/divisions/${slug}/matches?round=${round}`;
  const { data: matches, loading, error, waking } = useApi(path, [slug, round]);

  const rounds = meta?.rounds || [];

  return (
    <div className="section-gap">
      <div className="chip-row">
        <button className={`chip${round === 'all' ? ' active' : ''}`} onClick={() => setRound('all')}>All Weeks</button>
        {rounds.map((r) => (
          <button key={r} className={`chip${String(round) === String(r) ? ' active' : ''}`} onClick={() => setRound(r)}>
            Wk {r}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        <div className="card">
          {(!matches || matches.length === 0) ? (
            <Empty>No matches for this selection.</Empty>
          ) : (
            groupByRound(matches).map(([rd, list]) => (
              <div key={rd}>
                {round === 'all' && (
                  <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, letterSpacing: '.03em' }}>
                    Matchweek {rd}
                  </div>
                )}
                {list.map((m) => <MatchRow key={m.id} m={m} />)}
              </div>
            ))
          )}
        </div>
      )}
      <p className="muted" style={{ fontSize: 13 }}>
        Looking for a single team’s schedule? Open any <Link to="/teams" className="linklike">team page</Link> for its full fixture list and form.
      </p>
    </div>
  );
}

function groupByRound(matches) {
  const map = new Map();
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round).push(m);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}
