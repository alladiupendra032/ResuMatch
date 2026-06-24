import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Candidate pages
import CandidateDashboard    from './pages/candidate/Dashboard';
import CandidateProfile      from './pages/candidate/Profile';
import CandidateJobs         from './pages/candidate/Jobs';
import CandidateApplications from './pages/candidate/Applications';

// Recruiter pages
import RecruiterDashboard  from './pages/recruiter/Dashboard';
import RecruiterJobs       from './pages/recruiter/Jobs';
import RecruiterApplicants from './pages/recruiter/Applicants';

// Hiring Manager pages
import HMDashboard    from './pages/hiring_manager/Dashboard';
import HMJobs         from './pages/hiring_manager/Jobs';
import HMApplications from './pages/hiring_manager/Applications';

/** Redirect logged-in users to their role-specific dashboard */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'candidate')      return <Navigate to="/candidate/dashboard" replace />;
  if (user.role === 'hiring_manager') return <Navigate to="/hm/dashboard" replace />;
  return <Navigate to="/recruiter/dashboard" replace />;
}

const toastStyle = {
  style: {
    background:    'rgba(9,13,31,0.95)',
    color:         '#f1f5f9',
    border:        '1px solid rgba(255,255,255,0.12)',
    backdropFilter:'blur(20px)',
    fontFamily:    'Inter, sans-serif',
    fontSize:      '14px',
  },
  success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
  error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={toastStyle} />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Candidate routes */}
          <Route element={<DashboardLayout allowedRoles={['candidate']} />}>
            <Route path="/candidate/dashboard"    element={<CandidateDashboard />} />
            <Route path="/candidate/profile"      element={<CandidateProfile />} />
            <Route path="/candidate/jobs"         element={<CandidateJobs />} />
            <Route path="/candidate/applications" element={<CandidateApplications />} />
          </Route>

          {/* Recruiter routes */}
          <Route element={<DashboardLayout allowedRoles={['recruiter', 'admin']} />}>
            <Route path="/recruiter/dashboard"  element={<RecruiterDashboard />} />
            <Route path="/recruiter/jobs"       element={<RecruiterJobs />} />
            <Route path="/recruiter/applicants" element={<RecruiterApplicants />} />
          </Route>

          {/* Hiring Manager routes */}
          <Route element={<DashboardLayout allowedRoles={['hiring_manager']} />}>
            <Route path="/hm/dashboard"    element={<HMDashboard />} />
            <Route path="/hm/jobs"         element={<HMJobs />} />
            <Route path="/hm/applications" element={<HMApplications />} />
          </Route>

          {/* Smart redirect from root */}
          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
