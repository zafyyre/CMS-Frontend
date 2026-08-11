import { Link } from 'react-router-dom';

const FEES = [
  ['Team entry (per season)', '$2,150'],
  ['Player registration', '$95'],
  ['Referee assessment (per game)', '$140'],
  ['Field allocation deposit', '$500'],
];

const STEPS = [
  ['Confirm your club', 'Returning clubs confirm their divisions and team entries with the league office.'],
  ['Register players', 'Each player completes registration and provides proof of age and league clearance.'],
  ['Submit documents', 'Upload rosters, waivers and payment before the seasonal deadline.'],
  ['Get your schedule', 'Once approved, your fixtures appear on the Weekly Schedule and Standings pages.'],
];

export default function Registration() {
  return (
    <div className="section-gap">
      <div className="page-head">
        <span className="eyebrow">Join the League</span>
        <h2>Registration</h2>
        <p>Everything clubs and players need to enter the Northlake Metro Soccer League for the coming season.</p>
      </div>

      <div className="grid grid-side">
        <div className="card">
          <div className="card-head"><h3>How to Register</h3></div>
          <ol className="list-reset" style={{ counterReset: 'step' }}>
            {STEPS.map(([title, body], i) => (
              <li key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: 'var(--pitch-700)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{title}</div>
                  <div className="muted" style={{ fontSize: 14 }}>{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="section-gap">
          <div className="card">
            <div className="card-head"><h3>Fees</h3></div>
            <table className="tbl">
              <tbody>
                {FEES.map(([label, amount]) => (
                  <tr key={label}>
                    <td className="l">{label}</td>
                    <td style={{ fontWeight: 700, textAlign: 'right' }}>{amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Key Deadlines</h3>
            <ul className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 14, display: 'grid', gap: 6 }}>
              <li>Club intent to return — early August</li>
              <li>Team &amp; player registration — late August</li>
              <li>Season kickoff — mid September</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card card-pad center" style={{ background: 'var(--surface-2)' }}>
        <h3 style={{ fontSize: 18 }}>Questions about registering?</h3>
        <p className="muted" style={{ maxWidth: '52ch', margin: '8px auto 16px' }}>
          The league office is happy to help new and returning clubs through the process.
        </p>
        <Link to="/about" className="btn btn-primary">Contact the League Office</Link>
      </div>
    </div>
  );
}
