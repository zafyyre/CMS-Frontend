import { Link } from 'react-router-dom';

const EXEC = [
  ['President', 'A. Whitfield'],
  ['Vice President', 'E. Solberg'],
  ['General Secretary', 'C. Okonkwo'],
  ['Registrar', 'L. Hollins'],
  ['Discipline Chair', 'J. Thornbury'],
  ['Referee Coordinator', 'M. Ferreira-Cole'],
];

export default function About() {
  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">About Us</span>
        <h2>About the NMSL</h2>
        <p>A demonstration amateur soccer league. Every club, person and result on this site is fictional.</p>
      </div>

      <div className="grid grid-side">
        <div className="card card-pad">
          <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <strong>⚠️ Sample data.</strong>{' '}
            <span className="muted">
              The Northlake Metro Soccer League is not a real organization. All clubs, venues, officials,
              players, results and disciplinary records shown here are invented for demonstration purposes.
            </span>
          </div>

          <h3 style={{ fontSize: 18 }}>Our Purpose</h3>
          <p className="muted">
            The league exists to organize competitive amateur soccer across the region — running the season
            schedule, maintaining the tables, appointing match officials, and administering registration and
            discipline on behalf of its member clubs.
          </p>
          <p className="muted">
            It fields {' '}
            <Link to="/standings" className="linklike">multiple divisions</Link> of open-age and masters soccer,
            alongside a full slate of <Link to="/cups" className="linklike">cup competitions</Link>. Champions of the
            Premier Division lift the Premiership Shield, and the knockout season culminates in the Founders Cup final.
          </p>
          <div className="divider" />
          <h3 style={{ fontSize: 18 }}>About This Build</h3>
          <p className="muted">
            This site is a demonstration league-management platform. Standings are computed
            automatically from match results, schedules are filterable by division and week, and every team links
            through to its own fixtures, results and form. It’s built as a React single-page app on top of a
            Node/Express + SQLite backend.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Referees manage their own games through the <Link to="/referee" className="linklike">Referee Portal</Link>:
            they accept game invitations, see their upcoming and past assignments, and file match reports. Submitting
            a report confirms the result — feeding it straight into the live standings — and any send-off opens a
            discipline case automatically.
          </p>
        </div>

        <div className="section-gap">
          <div className="card">
            <div className="card-head"><h3>League Executive</h3></div>
            <table className="tbl">
              <tbody>
                {EXEC.map(([role, name]) => (
                  <tr key={role}>
                    <td className="l muted">{role}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>League Office</h3>
            <div className="muted" style={{ fontSize: 14, display: 'grid', gap: 4 }}>
              <span>✉️ office@nmsl.example</span>
              <span>📍 Northlake (fictional)</span>
              <span>🕑 Mon–Thu, 10am–4pm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
