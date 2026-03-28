import { Navigate } from 'react-router-dom';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('topupgg_user') || '{}');
  } catch {
    return {};
  }
}

export default function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem('topupgg_token');
  const user = getStoredUser();

  if (token && user?.id) {
    const role = String(user.type || user.role || '').toLowerCase();
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}