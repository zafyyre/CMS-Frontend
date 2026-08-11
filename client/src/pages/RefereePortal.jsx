import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost, useApi } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Spinner, ErrorBox, Crest, Empty } from '../components/ui.jsx';
import { fmtDay, fmtTime, fmtDateLong } from '../format.js';

/* ---------------- Referee dashboard ---------------- */

export default function RefereeDashboard() {
  const { logout } = useAuth();
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useApi('/me/assignments', [tick]);
  const refresh = () => setTick((t) => t + 1);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  const { referee, stats, invitations, upcoming, past } = data;

  return (
    <div className="section-gap">
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 22, background: 'linear-gradient(100deg, rgba(15,81,50,.10), transparent)' }}>
          <Crest name={referee.name} color="#0f5132" size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="eyebrow">Referee Portal</span>
            <h2 style={{ fontSize: 24, margin: '2px 0' }}>{referee.name}</h2>
            <div className="muted" style={{ fontSize: 13.5 }}>{referee.grade} official · {referee.email}</div>
          </div>
          <button className="btn btn-sm" onClick={logout}>Sign out</button>
        </div>
        <div className="grid grid-4" style={{ gap: 0, borderTop: '1px solid var(--border)' }}>
          <MiniStat n={stats.invitations} k="Invitations" />
          <MiniStat n={stats.upcoming} k="Upcoming" />
          <MiniStat n={stats.awaiting} k="Reports Due" />
          <MiniStat n={stats.reports} k="Reports Filed" />
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Game Invitations</h3>
          <span className="tag amber">{invitations.length} pending</span>
        </div>
        {invitations.length === 0 ? (
          <Empty>No pending invitations — you’re all caught up.</Empty>
        ) : (
          invitations.map((a) => <Invitation key={a.assignment_id} a={a} onDone={refresh} />)
        )}
      </section>

      <section className="card">
        <div className="card-head"><h3>Upcoming Games</h3><span className="tag blue">{upcoming.length}</span></div>
        {upcoming.length === 0 ? <Empty>No confirmed upcoming games.</Empty> : (
          <ul className="list-reset">
            {upcoming.map((a) => <GameLine key={a.assignment_id} a={a} kind="upcoming" />)}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Past Games &amp; Reports</h3>
          {stats.awaiting > 0 && <span className="tag amber">{stats.awaiting} report{stats.awaiting === 1 ? '' : 's'} due</span>}
        </div>
        {past.length === 0 ? <Empty>No past games yet.</Empty> : (
          <ul className="list-reset">
            {past.map((a) => <PastGame key={a.assignment_id} a={a} onDone={refresh} />)}
          </ul>
        )}
      </section>

      <p className="muted center" style={{ fontSize: 13 }}>
        Your accepted games also appear publicly on the <Link to="/weekly" className="linklike">weekly schedule</Link>.
      </p>
    </div>
  );
}

function MiniStat({ n, k }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 0' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--pitch-700)' }}>{n}</div>
      <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
    </div>
  );
}

/* ---------------- Rows ---------------- */

function Fixture({ m }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{m.home.name}</span>
        <Crest name={m.home.name} color={m.home.color} />
      </span>
      <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
        {m.status === 'final' ? `${m.home.score} – ${m.away.score}` : 'vs'}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Crest name={m.away.name} color={m.away.color} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{m.away.name}</span>
      </span>
    </div>
  );
}

function Meta({ m }) {
  return (
    <div className="muted" style={{ fontSize: 12.5, marginTop: 6, textAlign: 'center' }}>
      {fmtDateLong(m.kickoff)} · {fmtTime(m.kickoff)} · {m.division.name}
      {m.field && <> · {m.field.name}, {m.field.city}</>}
    </div>
  );
}

function Invitation({ a, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const respond = async (action) => {
    setBusy(true); setErr(null);
    try {
      await apiPost(`/assignments/${a.assignment_id}/respond`, { action });
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
      <Fixture m={a.match} />
      <Meta m={a.match} />
      {err && <div className="error-box" style={{ marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => respond('accept')}>✓ Accept assignment</button>
        <button className="btn btn-sm" disabled={busy} onClick={() => respond('decline')}>Decline</button>
      </div>
    </div>
  );
}

function GameLine({ a }) {
  const m = a.match;
  return (
    <li style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <Fixture m={m} />
      <Meta m={m} />
    </li>
  );
}

function PastGame({ a, onDone }) {
  const [open, setOpen] = useState(false);
  const m = a.match;
  return (
    <li style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <Fixture m={m} />
      <Meta m={m} />
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        {a.awaiting ? (
          <button className="btn btn-accent btn-sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Cancel' : '📝 File match report'}
          </button>
        ) : (
          <ReportSummary report={a.report} />
        )}
      </div>
      {a.awaiting && open && <ReportForm assignmentId={a.assignment_id} match={m} onDone={onDone} />}
    </li>
  );
}

function ReportSummary({ report }) {
  if (!report) return <span className="tag">No report</span>;
  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <span className="tag green">✓ Report filed</span>
      {report.cards.length > 0
        ? report.cards.map((c, i) => (
            <span key={i} className={`tag ${c.card === 'Red' ? 'red' : 'amber'}`}>
              {c.card === 'Red' ? '🟥' : '🟨'} {c.player_name} {c.minute ? `${c.minute}'` : ''}
            </span>
          ))
        : <span className="muted" style={{ fontSize: 12.5 }}>No cautions</span>}
    </div>
  );
}

/* ---------------- Report form ---------------- */

const emptyCard = () => ({ side: 'home', player: '', type: 'Yellow', minute: '', reason: '' });

function ReportForm({ assignmentId, match, onDone }) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [abandoned, setAbandoned] = useState(false);
  const [notes, setNotes] = useState('');
  const [cards, setCards] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const setCard = (i, patch) => setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const addCard = () => setCards((cs) => [...cs, emptyCard()]);
  const removeCard = (i) => setCards((cs) => cs.filter((_, j) => j !== i));

  const submit = async () => {
    setErr(null);
    if (home === '' || away === '') { setErr('Enter the final score for both teams.'); return; }
    setBusy(true);
    try {
      await apiPost(`/assignments/${assignmentId}/report`, {
        home_score: Number(home),
        away_score: Number(away),
        abandoned,
        notes,
        cards: cards
          .filter((c) => c.player.trim())
          .map((c) => ({ side: c.side, player: c.player.trim(), type: c.type, minute: c.minute === '' ? null : Number(c.minute), reason: c.reason.trim() })),
      });
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const numBox = { width: 64, textAlign: 'center', fontSize: 20, fontWeight: 800 };

  return (
    <div style={{ marginTop: 14, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <h4 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--pitch-700)', marginBottom: 12 }}>Match Report</h4>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{match.home.name}</div>
          <input className="input" style={numBox} inputMode="numeric" value={home} onChange={(e) => setHome(e.target.value.replace(/\D/g, ''))} placeholder="0" />
        </div>
        <span style={{ fontWeight: 800, color: 'var(--muted)' }}>–</span>
        <div style={{ textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{match.away.name}</div>
          <input className="input" style={numBox} inputMode="numeric" value={away} onChange={(e) => setAway(e.target.value.replace(/\D/g, ''))} placeholder="0" />
        </div>
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12, fontSize: 13.5 }} className="muted">
        <input type="checkbox" checked={abandoned} onChange={(e) => setAbandoned(e.target.checked)} />
        Match abandoned / not completed
      </label>

      <div className="divider" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 13.5 }}>Cautions &amp; Send-offs</strong>
        <button className="btn btn-sm" onClick={addCard}>+ Add card</button>
      </div>
      {cards.length === 0 && <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>No cards issued. Add any yellows or reds above.</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="input" value={c.side} onChange={(e) => setCard(i, { side: e.target.value })}>
              <option value="home">{match.home.name}</option>
              <option value="away">{match.away.name}</option>
            </select>
            <input className="input" style={{ flex: '1 1 120px' }} placeholder="Player name" value={c.player} onChange={(e) => setCard(i, { player: e.target.value })} />
            <select className="input" value={c.type} onChange={(e) => setCard(i, { type: e.target.value })}>
              <option>Yellow</option>
              <option>Red</option>
            </select>
            <input className="input" style={{ width: 70 }} inputMode="numeric" placeholder="min" value={c.minute} onChange={(e) => setCard(i, { minute: e.target.value.replace(/\D/g, '') })} />
            <input className="input" style={{ flex: '1 1 140px' }} placeholder="Reason" value={c.reason} onChange={(e) => setCard(i, { reason: e.target.value })} />
            <button className="btn btn-sm" onClick={() => removeCard(i)} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>

      <textarea className="input" style={{ width: '100%', marginTop: 12, minHeight: 70, resize: 'vertical' }}
        placeholder="Match notes (optional) — incidents, injuries, field conditions…"
        value={notes} onChange={(e) => setNotes(e.target.value)} />

      {err && <div className="error-box" style={{ marginTop: 10 }}>{err}</div>}
      <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <span className="muted" style={{ fontSize: 12, alignSelf: 'center', marginRight: 'auto' }}>Red cards open a discipline case automatically.</span>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit report'}</button>
      </div>
    </div>
  );
}
