import { useState } from 'react';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, Empty } from '../components/ui.jsx';
import { fmtDateLong } from '../format.js';

const TABS = [
  ['all', 'All'],
  ['news', 'News'],
  ['notice', 'Notices'],
];

export default function News() {
  const [cat, setCat] = useState('all');
  const path = cat === 'all' ? '/news' : `/news?category=${cat}`;
  const { data, loading, error, waking } = useApi(path, [cat]);
  if (loading) return <Spinner waking={waking} />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Notice Board</span>
        <h2>News &amp; Notices</h2>
        <p>League announcements, results highlights and official notices for clubs and players.</p>
      </div>

      <div className="chip-row">
        {TABS.map(([k, label]) => (
          <button key={k} className={`chip${cat === k ? ' active' : ''}`} onClick={() => setCat(k)}>{label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        !data || data.length === 0 ? <Empty>No posts.</Empty> : (
          <div className="section-gap">
            {data.map((n) => (
              <article key={n.id} className="card card-pad">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span className={`tag ${n.category === 'notice' ? 'amber' : 'green'}`}>
                    {n.category === 'notice' ? 'Notice' : 'News'}
                  </span>
                  {!!n.pinned && <span className="tag blue">📌 Pinned</span>}
                  <span className="muted" style={{ fontSize: 13 }}>{fmtDateLong(n.posted_at)}</span>
                  {n.ref && <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>Ref #{n.ref}</span>}
                </div>
                <h3 style={{ fontSize: 19, marginBottom: 8 }}>{n.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{n.body}</p>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}
