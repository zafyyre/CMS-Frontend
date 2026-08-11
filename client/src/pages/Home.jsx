import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { Spinner, ErrorBox, MatchRow, TeamInline, Crest } from '../components/ui.jsx';
import { fmtDate } from '../format.js';

export default function Home() {
  const { data, loading, error } = useApi('/summary');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  const { news, upcoming, results, premierTop, stats } = data;
  const [lead, ...rest] = news;

  return (
    <div className="section-gap">
      <section className="hero">
        <span className="eyebrow">Demo Amateur League · Est. 1998</span>
        <h2>Every result, table and fixture — in one clear place.</h2>
        <p>
          Live standings that update themselves from match results, weekly fixtures, cup brackets and
          discipline records across {stats.divisions} divisions and {stats.teams} teams.
        </p>
        <div className="actions">
          <Link to="/standings" className="btn btn-accent">View Standings</Link>
          <Link to="/weekly" className="btn">This Week’s Games</Link>
        </div>
      </section>

      <section className="grid grid-4">
        <Stat n={stats.teams} k="Teams" />
        <Stat n={stats.played} k="Matches Played" />
        <Stat n={stats.goals} k="Goals Scored" />
        <Stat n={stats.fields} k="Fields" />
      </section>

      <section className="grid grid-side">
        <div className="card">
          <div className="card-head">
            <h3>Upcoming Fixtures</h3>
            <Link to="/weekly" className="linklike">Weekly schedule →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty">No upcoming fixtures scheduled.</div>
          ) : (
            upcoming.map((m) => <MatchRow key={m.id} m={m} showDivision />)
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Premier Table</h3>
            <Link to="/standings/premier" className="linklike">Full table →</Link>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="rank">#</th><th className="l">Team</th><th>P</th><th>GD</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {premierTop.map((r) => (
                  <tr key={r.team_id}>
                    <td className="rank">{r.rank}</td>
                    <td className="l"><TeamInline team={{ name: r.team, slug: r.slug, color: r.color }} /></td>
                    <td>{r.gp}</td>
                    <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className="pts">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-side">
        <div className="card">
          <div className="card-head">
            <h3>Latest News &amp; Notices</h3>
            <Link to="/news" className="linklike">All news →</Link>
          </div>
          <div className="card-pad" style={{ paddingBottom: 8 }}>
            {lead && (
              <article style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span className={`tag ${lead.category === 'notice' ? 'amber' : 'green'}`}>
                    {lead.category === 'notice' ? 'Notice' : 'News'}
                  </span>
                  <span className="muted" style={{ fontSize: 12.5 }}>{fmtDate(lead.posted_at)}</span>
                </div>
                <h3 style={{ fontSize: 19, marginBottom: 6 }}>{lead.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{lead.body}</p>
              </article>
            )}
          </div>
          <ul className="list-reset">
            {rest.map((n) => (
              <li key={n.id} style={{ borderTop: '1px solid var(--border)', padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span className={`tag ${n.category === 'notice' ? 'amber' : 'green'}`}>
                    {n.category === 'notice' ? 'Notice' : 'News'}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>{fmtDate(n.posted_at)}</span>
                </div>
                <div style={{ fontWeight: 600 }}>{n.title}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-head"><h3>Recent Results</h3></div>
          <ul className="list-reset">
            {results.map((m) => (
              <li key={m.id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 6 }}>{m.division.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Crest name={m.home.name} color={m.home.color} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{m.home.name}</span>
                  </span>
                  <span style={{ fontWeight: 800 }}>{m.home.score}–{m.away.score}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexDirection: 'row-reverse' }}>
                    <Crest name={m.away.name} color={m.away.color} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, textAlign: 'right' }}>{m.away.name}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, k }) {
  return (
    <div className="stat">
      <div className="n">{n}</div>
      <div className="k">{k}</div>
    </div>
  );
}
