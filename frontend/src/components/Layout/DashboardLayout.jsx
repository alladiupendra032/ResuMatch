import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'candidate')      return <Navigate to="/candidate/dashboard" replace />;
    if (user.role === 'hiring_manager') return <Navigate to="/hm/dashboard" replace />;
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <Outlet />
      </main>
    </div>
  );
}
