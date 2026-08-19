import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, Crest, Empty } from '../components/ui.jsx';

export default function Teams() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [division, setDivision] = useState('all');
  const { data: divisions } = useApi('/divisions');
  const { data: teams, loading, error, waking } = useApi('/teams');
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  const setQuery = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set('q', val); else next.delete('q');
    setParams(next, { replace: true });
  };

  const filtered = (teams || []).filter((t) => {
    const okDiv = division === 'all' || t.division_slug === division;
    const okQ = !q || t.name.toLowerCase().includes(q.toLowerCase()) || (t.club || '').toLowerCase().includes(q.toLowerCase());
    return okDiv && okQ;
  });

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Directory</span>
        <h2>Teams</h2>
        <p>Browse all {teams ? teams.length : ''} clubs competing across the league. Select a team to see its squad info, fixtures, results and current form.</p>
      </div>

      <div className="card card-pad">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Search by team or club…"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: '1 1 240px' }}
          />
          <div className="chip-row">
            <button className={`chip${division === 'all' ? ' active' : ''}`} onClick={() => setDivision('all')}>All</button>
            {(divisions || []).map((d) => (
              <button key={d.slug} className={`chip${division === d.slug ? ' active' : ''}`} onClick={() => setDivision(d.slug)}>
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        filtered.length === 0 ? <Empty>No teams match your search.</Empty> : (
          <div className="grid grid-3">
            {filtered.map((t) => (
              <Link key={t.id} to={`/teams/${t.slug}`} className="card card-pad" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <Crest name={t.name} color={t.color} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{t.division_name}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{t.club}</div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
