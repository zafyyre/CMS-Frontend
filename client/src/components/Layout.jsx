import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const { user, logout } = useAuth();
  const headerTopRef = useRef(null);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  // Any navigation closes the menu, including back/forward and the search form,
  // not only taps on a menu link.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // While open: Escape or a tap anywhere outside the menu closes it, the page
  // underneath stops scrolling, and widening the window past the menu
  // breakpoint can't leave it stuck open.
  // Outside taps are caught on the document, not just the backdrop, because the
  // header bar sits above the backdrop: tapping the logo or the empty space
  // beside it used to leave the menu open. The toggle is left out since it
  // flips the menu itself, and the very click that opens the menu can still
  // reach this listener once React has run the effect.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onTap = (e) => {
      if (navRef.current?.contains(e.target) || toggleRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const wide = window.matchMedia('(min-width: 1025px)');
    const onWide = () => { if (wide.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onTap);
    wide.addEventListener('change', onWide);
    document.documentElement.classList.add('nav-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onTap);
      wide.removeEventListener('change', onWide);
      document.documentElement.classList.remove('nav-open');
    };
  }, [open]);

  // The menu panel is capped to the screen space below the header, and the
  // header grows when the league name wraps on narrow phones, so measure it.
  // Measuring directly each time the menu opens keeps the cap right even if a
  // ResizeObserver callback hasn't been delivered yet; the observer then tracks
  // later changes, such as a phone being rotated with the menu open.
  useEffect(() => {
    const el = headerTopRef.current;
    if (!el) return undefined;
    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

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
        <div className="container header-top" ref={headerTopRef}>
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
          <button
            type="button"
            className="nav-toggle"
            ref={toggleRef}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
        <nav id="site-nav" ref={navRef} className={`main-nav${open ? ' open' : ''}`}>
          <div className="container">
            {/* A tapped link closes the menu, even the link for the current page,
                which doesn't change the route. Blank space between the items is
                part of the panel, so like its padding it keeps the menu open. */}
            <ul onClick={(e) => { if (e.target.closest('a')) setOpen(false); }}>
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

      {/* Dims the page behind the open menu and takes the tap that closes it, so
          that tap can't also press whatever is underneath. */}
      <div className={`nav-backdrop${open ? ' open' : ''}`} aria-hidden="true" />

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
