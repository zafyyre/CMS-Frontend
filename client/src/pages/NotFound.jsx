import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card card-pad center" style={{ padding: '60px 20px' }}>
      <div style={{ fontSize: 52 }}>⚽</div>
      <h2 style={{ fontSize: 26, marginTop: 10 }}>Page not found</h2>
      <p className="muted" style={{ maxWidth: '40ch', margin: '8px auto 20px' }}>
        That page went out of bounds. Let’s get you back in play.
      </p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}
