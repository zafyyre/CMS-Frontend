import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const ROLE_ICON = { admin: '⚙️', coach: '📋', player: '⚽', referee: '🧑‍⚖️' };

const NAV = [
  ['Home', '/'],
  ['Weekly Schedule', '/weekly'],
  ['Standings', '/standings'],
  ['Teams', '/teams'],
  ['Cup Play', '/cups'],
  ['Discipline', '/discipline'],
  ['Fields', '/fields'],
  ['Referees', '/referees'],
  ['Registration', '/registration'],
  ['Notice Board', '/news'],
  ['About', '/about'],
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/teams?q=${encodeURIComponent(term)}`);
  };

  const doLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="app">
      <header className="site-header">
        <div className="container header-top">
          <Link to="/" className="brand">
            <span className="brand-badge">NM</span>
            <span className="brand-text">
              <h1>Northlake Metro Soccer League</h1>
              <span>Est. 1998 · Demo League</span>
            </span>
          </Link>
          <div className="header-spacer" />
          <form className="header-search" onSubmit={onSearch}>
            <span aria-hidden>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search teams…"
              aria-label="Search teams"
            />
          </form>
          {user ? (
            <div className="header-auth">
              <Link to="/portal" className="header-portal">{ROLE_ICON[user.role] || '👤'} My Portal</Link>
              <button className="btn btn-sm header-logout" onClick={doLogout}>Log out</button>
            </div>
          ) : (
            <Link to="/login" className="header-portal">Log in</Link>
          )}
          <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            ☰
          </button>
        </div>
        <nav className={`main-nav${open ? ' open' : ''}`}>
          <div className="container">
            <ul onClick={() => setOpen(false)}>
              {NAV.map(([label, to]) => (
                <li key={to}>
                  <NavLink to={to} end={to === '/'}>
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="nav-auth">
                {user
                  ? <NavLink to="/portal">{ROLE_ICON[user.role] || '👤'} My Portal</NavLink>
                  : <NavLink to="/login">Log in</NavLink>}
              </li>
              {user && (
                <li className="nav-auth">
                  <a href="#logout" onClick={(e) => { e.preventDefault(); doLogout(); }}>Log out</a>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </header>

      <main>
        <div className="container">{children}</div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4>Northlake Metro Soccer League</h4>
              <p style={{ margin: 0, maxWidth: '38ch' }}>
                A demonstration amateur soccer league — organizing divisions, fixtures, officials and
                registration for its member clubs.
              </p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><Link to="/standings">Standings &amp; Schedule</Link></li>
                <li><Link to="/weekly">Weekly Schedule</Link></li>
                <li><Link to="/cups">Cup Play</Link></li>
                <li><Link to="/discipline">Discipline</Link></li>
              </ul>
            </div>
            <div>
              <h4>League</h4>
              <ul>
                <li><Link to="/teams">Teams</Link></li>
                <li><Link to="/fields">Fields</Link></li>
                <li><Link to="/registration">Registration</Link></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            © {new Date().getFullYear()} Northlake Metro Soccer League · Demonstration project — the league,
            clubs, venues, people and results shown here are entirely fictional.
          </div>
        </div>
      </footer>
    </div>
  );
}
