import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const candidateNav = [
  { to: '/candidate/dashboard',    icon: '🏠', label: 'Dashboard' },
  { to: '/candidate/profile',      icon: '👤', label: 'My Profile' },
  { to: '/candidate/jobs',         icon: '💼', label: 'Browse Jobs' },
  { to: '/candidate/applications', icon: '📋', label: 'My Applications' },
];

const recruiterNav = [
  { to: '/recruiter/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/recruiter/jobs',        icon: '💼', label: 'Manage Jobs' },
  { to: '/recruiter/applicants',  icon: '👥', label: 'Applicants' },
];

const hiringManagerNav = [
  { to: '/hm/dashboard',      icon: '📊', label: 'Dashboard' },
  { to: '/hm/jobs',           icon: '💼', label: 'All Jobs' },
  { to: '/hm/applications',   icon: '👥', label: 'All Applications' },
];

const ROLE_LABELS = {
  candidate:       'Candidate',
  recruiter:       'Recruiter',
  hiring_manager:  'Hiring Manager',
  admin:           'Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks =
    user?.role === 'candidate'      ? candidateNav :
    user?.role === 'hiring_manager' ? hiringManagerNav :
    recruiterNav;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-brand-logo">R</div>
        <div>
          <div className="nav-brand-name">ResuMatch</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        <div className="nav-section-label">Navigation</div>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '16px' }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '16px' }}>
        <div style={{ padding: '10px 12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="nav-item btn-danger"
          style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent' }}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
