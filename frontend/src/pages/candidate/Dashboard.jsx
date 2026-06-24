import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resumeAPI, applicationsAPI } from '../../services/api';
import { getStatusClass, getStatusLabel, getMatchClass, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, appsRes] = await Promise.allSettled([
          resumeAPI.getMyProfile(),
          applicationsAPI.list(),
        ]);
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Profile completion score
  const profileCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.resumeUrl) score += 30;
    if (profile.email) score += 20;
    if (profile.skills?.length > 0) score += 30;
    if (profile.education?.length > 0) score += 20;
    return score;
  };

  const completion = profileCompletion();

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Track your applications and manage your profile.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(124,58,237,0.2)' }}>📋</div>
          <div className="kpi-value">{applications.length}</div>
          <div className="kpi-label">Total Applications</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>🔍</div>
          <div className="kpi-value">{statusCounts['under_review'] || 0}</div>
          <div className="kpi-label">Under Review</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(6,182,212,0.2)' }}>📞</div>
          <div className="kpi-value">{statusCounts['interview'] || 0}</div>
          <div className="kpi-label">Interviews</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>✅</div>
          <div className="kpi-value">{statusCounts['selected'] || 0}</div>
          <div className="kpi-label">Selected</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile Completion */}
        <div className="glass-card-static p-6">
          <h2 className="font-semibold text-lg mb-4">Profile Completion</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span className="text-muted text-sm">Overall Progress</span>
            <span className="font-bold" style={{ color: completion >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{completion}%</span>
          </div>
          <div className="progress-bar mb-4">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Resume Uploaded', points: 30, done: !!profile?.resumeUrl },
              { label: 'Contact Details', points: 20, done: !!profile?.email },
              { label: 'Skills Listed', points: 30, done: (profile?.skills?.length || 0) > 0 },
              { label: 'Education Added', points: 20, done: (profile?.education?.length || 0) > 0 },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: item.done ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className={`text-sm ${item.done ? '' : 'text-muted'}`}>{item.label}</span>
                </div>
                <span className="badge badge-gray">+{item.points}%</span>
              </div>
            ))}
          </div>
          {!profile && (
            <a href="/candidate/profile" className="btn btn-primary btn-full mt-4">
              Upload Resume to Get Started
            </a>
          )}
        </div>

        {/* Quick Stats */}
        <div className="glass-card-static p-6">
          <h2 className="font-semibold text-lg mb-4">Application Status</h2>
          {applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No applications yet</p>
              <a href="/candidate/jobs" className="btn btn-primary mt-4">Browse Jobs</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <span className={`text-sm font-semibold ${getStatusClass(status)}`}>{getStatusLabel(status)}</span>
                  <span className="badge badge-gray">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <div className="glass-card-static mt-6" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="font-semibold text-lg">Recent Applications</h2>
            <a href="/candidate/applications" className="btn btn-ghost btn-sm">View All</a>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Applied On</th>
                  <th>Match Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{app.jobTitle || 'N/A'}</td>
                    <td>{app.jobDepartment || '—'}</td>
                    <td>{formatDate(app.created_at)}</td>
                    <td>
                      {app.matchScore != null ? (
                        <span className={`badge ${getMatchClass(app.matchRank)}`}>
                          {app.matchScore.toFixed(0)}% · {app.matchRank}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`font-semibold ${getStatusClass(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
