import { useState, useEffect } from 'react';
import { analyticsAPI, applicationsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const chartDefaults = {
  color: '#94a3b8',
  font: { family: 'Inter, sans-serif', size: 12 },
};
ChartJS.defaults.color = chartDefaults.color;
ChartJS.defaults.font.family = chartDefaults.font.family;

const STATUS_COLORS = {
  applied:      '#6366f1',
  under_review: '#f59e0b',
  shortlisted:  '#3b82f6',
  interview:    '#8b5cf6',
  selected:     '#10b981',
  rejected:     '#ef4444',
};

export default function HMDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentApps, setRecentApps]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, appRes] = await Promise.allSettled([
          analyticsAPI.getSummary(),
          applicationsAPI.list({ sort_by: 'created_at' }),
        ]);
        if (aRes.status === 'fulfilled') setAnalytics(aRes.value.data);
        if (appRes.status === 'fulfilled') setRecentApps(appRes.value.data.slice(0, 8));
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const kpis = analytics?.kpis || {};
  const matchDist = analytics?.match_distribution || {};
  const statusDist = analytics?.status_distribution || {};
  const jobStats  = analytics?.job_stats || [];

  // Bar chart — top jobs by applicants
  const barData = {
    labels: jobStats.slice(0, 7).map(j => j.title.length > 22 ? j.title.slice(0, 22) + '…' : j.title),
    datasets: [{
      label: 'Applicants',
      data: jobStats.slice(0, 7).map(j => j.applicantCount),
      backgroundColor: 'rgba(139,92,246,0.7)',
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 6,
    }, {
      label: 'Avg Match %',
      data: jobStats.slice(0, 7).map(j => j.avgMatchScore),
      backgroundColor: 'rgba(16,185,129,0.5)',
      borderColor: '#10b981',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  // Doughnut — match quality
  const doughnutData = {
    labels: ['Excellent (≥85%)', 'Good (70-84%)', 'Moderate (50-69%)', 'Low (<50%)'],
    datasets: [{
      data: [matchDist.excellent || 0, matchDist.good || 0, matchDist.moderate || 0, matchDist.low || 0],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 2,
    }],
  };

  // Pipeline doughnut
  const statusLabels = Object.keys(statusDist);
  const pipelineData = {
    labels: statusLabels.map(s => s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())),
    datasets: [{
      data: statusLabels.map(s => statusDist[s]),
      backgroundColor: statusLabels.map(s => STATUS_COLORS[s] || '#6b7280'),
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 2,
    }],
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
  };

  const getScoreClass = (s) =>
    s >= 85 ? 'badge-excellent' : s >= 70 ? 'badge-good' : s >= 50 ? 'badge-moderate' : 'badge-low';

  const statusColor = (s) => STATUS_COLORS[s] || '#6b7280';

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Hiring Manager Dashboard</h1>
        <p className="page-subtitle">
          Platform-wide recruitment overview &amp; talent pipeline.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Applicants', value: kpis.total_applicants ?? 0, icon: '👥', color: '#8b5cf6' },
          { label: 'Active Jobs',      value: kpis.active_jobs      ?? 0, icon: '💼', color: '#3b82f6' },
          { label: 'In Interview',     value: kpis.interviews_scheduled ?? 0, icon: '🎙️', color: '#f59e0b' },
          { label: 'Offers Released',  value: kpis.offers_released  ?? 0, icon: '🏆', color: '#10b981' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{kpi.icon}</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: kpi.color, marginBottom: '4px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
            📊 Top Jobs by Applicants
          </h3>
          {jobStats.length > 0
            ? <Bar data={barData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { labels: { color: '#94a3b8' } } } }} height={200} />
            : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No data yet</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              🎯 Match Quality
            </h3>
            {(matchDist.excellent || 0) + (matchDist.good || 0) + (matchDist.moderate || 0) + (matchDist.low || 0) > 0
              ? <Doughnut data={doughnutData} options={chartOpts} />
              : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No applications yet</div>}
          </div>
          <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              🔄 Pipeline Status
            </h3>
            {statusLabels.length > 0
              ? <Doughnut data={pipelineData} options={chartOpts} />
              : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No applications yet</div>}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          🕐 Recent Applications
        </h3>
        {recentApps.length === 0
          ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No applications yet</div>
          : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['Candidate', 'Job', 'Match Score', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app, i) => (
                  <tr key={app.id || i} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{app.candidateName || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.candidateEmail || ''}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{app.jobTitle || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${getScoreClass(app.matchScore)}`}>
                        {(app.matchScore || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        background: `${statusColor(app.status)}22`, color: statusColor(app.status),
                      }}>
                        {(app.status || 'applied').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
