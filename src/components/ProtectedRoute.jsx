import { Navigate, useLocation } from 'react-router-dom';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('topupgg_user') || '{}');
  } catch {
    return {};
  }
}

export default function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const token = localStorage.getItem('topupgg_token');
  const user = getStoredUser();

  if (!token || !user?.id) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role) {
    const userRole = String(user.type || user.role || '').toLowerCase();
    if (userRole !== String(role).toLowerCase()) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}