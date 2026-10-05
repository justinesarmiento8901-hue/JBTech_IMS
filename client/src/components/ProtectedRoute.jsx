import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p style={{ padding: 16 }}>Loading...</p>;

  if (!user) {
    // Itatago ang pinuntahan para makabalik pagkatapos mag-login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <p style={{ padding: 16 }}>Wala kang pahintulot sa page na ito.</p>;
  }

  return children;
}