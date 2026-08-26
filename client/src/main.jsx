import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Chrome defaults history.scrollRestoration to 'auto', so on a pushState
// navigation it restores the previous entry's scroll offset — asynchronously,
// and after React has rendered the new page. That races ScrollToTop: when the
// browser wins, you land at the old offset on a shorter page and see empty
// space below the content, which looks exactly like a blank screen until you
// reload. Owning it removes the race entirely.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Inside the router so it can reset on navigation; outside the auth
          provider so a failure there is caught too. */}
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
