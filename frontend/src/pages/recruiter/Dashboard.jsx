import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
    tooltip: {
      backgroundColor: 'rgba(9,13,31,0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
    },
  },
};

export default function RecruiterDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getRecruiterAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
    </div>
  );

  const kpis = analytics?.kpis || {};
  const dist = analytics?.match_distribution || {};
  const statusDist = analytics?.status_distribution || {};

  // Bar chart: match distribution
  const barData = {
    labels: ['🟢 Excellent (85-100)', '🔵 Good (70-84)', '🟡 Moderate (50-69)', '🔴 Low (<50)'],
    datasets: [{
      label: 'Candidates',
      data: [dist.excellent || 0, dist.good || 0, dist.moderate || 0, dist.low || 0],
      backgroundColor: [
        'rgba(16,185,129,0.7)', 'rgba(6,182,212,0.7)',
        'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'
      ],
      borderColor: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'],
      borderWidth: 1,
      borderRadius: 8,
    }],
  };

  // Doughnut chart: status distribution
  const statusLabels = Object.keys(statusDist);
  const statusColors = {
    applied: 'rgba(148,163,184,0.8)',
    under_review: 'rgba(96,165,250,0.8)',
    shortlisted: 'rgba(196,181,253,0.8)',
    interview: 'rgba(252,211,77,0.8)',
    selected: 'rgba(110,231,183,0.8)',
    rejected: 'rgba(252,165,165,0.8)',
  };
  const doughnutData = {
    labels: statusLabels.map(s => s.replace('_', ' ')),
    datasets: [{
      data: statusLabels.map(s => statusDist[s]),
      backgroundColor: statusLabels.map(s => statusColors[s] || 'rgba(148,163,184,0.5)'),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    }],
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Recruiter Dashboard</h1>
        <p className="page-subtitle">Analytics overview of your hiring campaigns.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(124,58,237,0.2)' }}>👥</div>
          <div className="kpi-value">{kpis.total_applicants ?? 0}</div>
          <div className="kpi-label">Total Applicants</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(6,182,212,0.2)' }}>💼</div>
          <div className="kpi-value">{kpis.active_jobs ?? 0}</div>
          <div className="kpi-label">Active Jobs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>📞</div>
          <div className="kpi-value">{kpis.interviews_scheduled ?? 0}</div>
          <div className="kpi-label">Interviews</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>🎉</div>
          <div className="kpi-value">{kpis.offers_released ?? 0}</div>
          <div className="kpi-label">Offers Released</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-6">
        <div className="glass-card-static p-6">
          <h2 className="font-semibold text-lg mb-4">Match Score Distribution</h2>
          {(dist.excellent + dist.good + dist.moderate + dist.low) > 0 ? (
            <div style={{ height: '260px' }}>
              <Bar data={barData} options={{
                ...chartDefaults,
                scales: {
                  x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
                },
              }} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No applications yet</p>
            </div>
          )}
        </div>

        <div className="glass-card-static p-6">
          <h2 className="font-semibold text-lg mb-4">Application Pipeline</h2>
          {statusLabels.length > 0 ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{ ...chartDefaults, cutout: '65%' }} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🥧</div>
              <p>No applications yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Per-job stats */}
      {analytics?.job_stats?.length > 0 && (
        <div className="glass-card-static" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="font-semibold text-lg">Job Performance</h2>
            <a href="/recruiter/jobs" className="btn btn-ghost btn-sm">Manage Jobs</a>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Avg Match Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.job_stats.map(job => (
                  <tr key={job.jobId}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{job.title}</td>
                    <td>
                      <span className={`badge ${job.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{job.applicantCount}</td>
                    <td>
                      <span className={`badge ${job.avgMatchScore >= 70 ? 'badge-green' : job.avgMatchScore >= 50 ? 'badge-amber' : 'badge-red'}`}>
                        {job.avgMatchScore}%
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
