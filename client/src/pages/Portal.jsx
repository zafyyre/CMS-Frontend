import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';
import AdminDashboard from './dash/AdminDashboard.jsx';
import CoachDashboard from './dash/CoachDashboard.jsx';
import PlayerDashboard from './dash/PlayerDashboard.jsx';
import RefereeDashboard from './RefereePortal.jsx';

export default function Portal() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner waking={waking} />;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin': return <AdminDashboard />;
    case 'coach': return <CoachDashboard />;
    case 'player': return <PlayerDashboard />;
    case 'referee': return <RefereeDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}
