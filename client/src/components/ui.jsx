import { Link } from 'react-router-dom';
import { initials, fmtDay, fmtTime } from '../format.js';

export function Crest({ name, color, size }) {
  return (
    <span className={`crest${size === 'lg' ? ' lg' : ''}`} style={{ background: color || '#0b3d2e' }}>
      {initials(name)}
    </span>
  );
}

export function TeamInline({ team, align }) {
  const content = (
    <>
      <Crest name={team.name} color={team.color} />
      <span className="name">{team.name}</span>
    </>
  );
  const style = align === 'right' ? { flexDirection: 'row-reverse' } : undefined;
  if (team.slug) {
    return (
      <Link to={`/teams/${team.slug}`} className="team-inline" style={style}>
        {content}
      </Link>
    );
  }
  return <span className="team-inline" style={style}>{content}</span>;
}

export function FormRow({ form }) {
  if (!form || !form.length) return <span className="muted" style={{ fontSize: 12 }}>—</span>;
  return (
    <span className="form-row">
      {form.map((r, i) => (
        <span key={i} className={`form-pill ${r}`} title={r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss'}>
          {r}
        </span>
      ))}
    </span>
  );
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

export function ErrorBox({ message }) {
  return <div className="error-box">Couldn’t load data: {message}</div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// A single fixture / result row used across pages.
export function MatchRow({ m, showDivision }) {
  const final = m.status === 'final';
  const past = new Date(m.kickoff).getTime() < Date.now();
  const awaiting = !final && past;
  const ref = m.referee && m.referee.status === 'accepted' ? m.referee.name : null;
  return (
    <div className="match">
      <div className="when">
        <strong>{fmtDay(m.kickoff)}</strong>
        {final ? (showDivision ? m.division.name : fmtTime(m.kickoff)) : fmtTime(m.kickoff)}
      </div>
      <div className="team-inline home" style={{ flexDirection: 'row-reverse' }}>
        <Crest name={m.home.name} color={m.home.color} />
        <Link to={`/teams/${m.home.slug}`} className="name" style={{ fontWeight: 600 }}>
          {m.home.name}
        </Link>
      </div>
      <div className={`score${final ? '' : ' sched'}`}>
        {final ? `${m.home.score} – ${m.away.score}` : awaiting ? '—' : 'vs'}
      </div>
      <div className="team-inline away">
        <Crest name={m.away.name} color={m.away.color} />
        <Link to={`/teams/${m.away.slug}`} className="name" style={{ fontWeight: 600 }}>
          {m.away.name}
        </Link>
      </div>
      <div className="meta">
        {showDivision && !final && <span>{m.division.name} · </span>}
        {m.field ? `${m.field.name}, ${m.field.city}` : 'Venue TBD'}
        {ref && <span> · Ref: {ref}</span>}
        {final && <span className="tag green" style={{ marginLeft: 8 }}>Full time</span>}
        {awaiting && <span className="tag amber" style={{ marginLeft: 8 }}>Awaiting result</span>}
      </div>
    </div>
  );
}
