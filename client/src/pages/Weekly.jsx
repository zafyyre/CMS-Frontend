import { useState } from 'react';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, MatchRow, Empty } from '../components/ui.jsx';
import { fmtDateLong, dayKey } from '../format.js';

export default function Weekly() {
  const [offset, setOffset] = useState(0);
  const [division, setDivision] = useState('all');
  const { data: divisions } = useApi('/divisions');
  const { data, loading, error } = useApi(`/weekly?offset=${offset}`, [offset]);

  const rangeLabel = data
    ? `${fmtDateLong(data.weekStart)} – ${fmtDateLong(shiftDay(data.weekEnd, -1))}`
    : '';

  const matches = (data?.matches || []).filter(
    (m) => division === 'all' || m.division.slug === division
  );

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Weekly Schedule</span>
        <h2>This Week’s Matches</h2>
        <p>All fixtures and results across every division for the selected week. Use the arrows to move between weeks.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <button className="btn btn-sm" onClick={() => setOffset((o) => o - 1)}>← Prev</button>
          <div className="center">
            <div style={{ fontWeight: 700 }}>{rangeLabel || 'Loading…'}</div>
            {offset === 0 && <span className="tag green" style={{ marginTop: 4 }}>Current week</span>}
          </div>
          <button className="btn btn-sm" onClick={() => setOffset((o) => o + 1)}>Next →</button>
        </div>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <div className="chip-row">
            <button className={`chip${division === 'all' ? ' active' : ''}`} onClick={() => setDivision('all')}>All Divisions</button>
            {(divisions || []).map((d) => (
              <button key={d.slug} className={`chip${division === d.slug ? ' active' : ''}`} onClick={() => setDivision(d.slug)}>
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? <Spinner /> : error ? <div className="card-pad"><ErrorBox message={error} /></div> : (
          matches.length === 0 ? (
            <Empty>No matches scheduled for this week{division !== 'all' ? ' in this division' : ''}.</Empty>
          ) : (
            <div style={{ marginTop: 12 }}>
              {groupByDay(matches).map((group) => (
                <div key={group.key}>
                  <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                    {fmtDateLong(group.label)}
                  </div>
                  {group.list.map((m) => <MatchRow key={m.id} m={m} showDivision />)}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function groupByDay(matches) {
  const map = new Map();
  for (const m of matches) {
    const key = dayKey(m.kickoff);
    if (!map.has(key)) map.set(key, { key, label: m.kickoff, list: [] });
    map.get(key).list.push(m);
  }
  return [...map.values()].sort((a, b) => new Date(a.label) - new Date(b.label));
}

function shiftDay(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
