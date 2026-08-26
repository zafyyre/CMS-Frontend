import { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resetStaticDemo } from '../staticApi.js';

/**
 * Catches render-time errors so a crash can never blank the page.
 *
 * Without a boundary React unmounts the whole tree on any thrown error,
 * leaving an empty <div id="root"> — a white screen carrying no clue about
 * what failed. This turns that into a readable panel that names the error,
 * which both keeps the site usable and makes the cause reportable.
 */
class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfaced in the console so a reproduction can be traced to a component.
    console.error('Unhandled render error:', error, info && info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const clearAndReload = () => {
      // A corrupt localStorage overlay is one of the few things that can throw
      // on every render, so offer an escape hatch that isn't "clear site data".
      resetStaticDemo();
      window.location.assign('/');
    };

    return (
      <div className="container" style={{ padding: '48px 0', maxWidth: 640 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ marginBottom: 8 }}>⚽ Something went wrong</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6 }}>
            This page hit an unexpected error. Nothing is broken permanently — reloading
            almost always clears it.
          </p>

          <pre
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.5,
              overflowX: 'auto',
              marginBottom: 18,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {String((error && error.message) || error)}
          </pre>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <Link to="/" className="btn" onClick={() => this.setState({ error: null })}>
              Go home
            </Link>
            <button type="button" className="btn" onClick={clearAndReload}>
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Keying the boundary by pathname clears a caught error as soon as the user
 * navigates, so one bad page can't wedge the rest of the site.
 */
export default function ErrorBoundary({ children }) {
  const location = useLocation();
  return <Boundary key={location.pathname}>{children}</Boundary>;
}
