import { useState, useEffect, useCallback } from 'react';
import { applicationsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'];

const STATUS_COLORS = {
  applied:      { bg: '#6366f122', text: '#6366f1' },
  under_review: { bg: '#f59e0b22', text: '#f59e0b' },
  shortlisted:  { bg: '#3b82f622', text: '#3b82f6' },
  interview:    { bg: '#8b5cf622', text: '#8b5cf6' },
  selected:     { bg: '#10b98122', text: '#10b981' },
  rejected:     { bg: '#ef444422', text: '#ef4444' },
};

const SCORE_THRESHOLDS = [
  { label: 'All Scores', value: '' },
  { label: 'Excellent ≥85%', value: '85' },
  { label: 'Good ≥70%', value: '70' },
  { label: 'Moderate ≥50%', value: '50' },
];

export default function HMApplications() {
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [minScore, setMinScore]   = useState('');
  const [search, setSearch]       = useState('');
  const [updating, setUpdating]   = useState(null);
  const [selected, setSelected]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort_by: 'matchScore' };
      if (statusFilter) params.status = statusFilter;
      if (minScore)     params.min_score = minScore;
      const res = await applicationsAPI.list(params);
      setApps(res.data || []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, minScore]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (appId, newStatus) => {
    setUpdating(appId);
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selected?.id === appId) setSelected(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to "${newStatus.replace('_', ' ')}"`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getScoreClass = (s) =>
    s >= 85 ? 'badge-excellent' : s >= 70 ? 'badge-good' : s >= 50 ? 'badge-moderate' : 'badge-low';

  const filtered = apps.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.candidateName?.toLowerCase().includes(q) ||
      a.jobTitle?.toLowerCase().includes(q) ||
      a.candidateEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">All Applications</h1>
        <p className="page-subtitle">Review, filter, and advance candidates through the hiring pipeline.</p>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search candidate or job..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
        />
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding: '8px 14px', background: 'rgba(15,18,40,0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select value={minScore} onChange={e => setMinScore(e.target.value)}
          style={{ padding: '8px 14px', background: 'rgba(15,18,40,0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
          {SCORE_THRESHOLDS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main Grid: Table + Detail Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '20px' }}>
        {/* Applications Table */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div>No applications match your filters</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Candidate', 'Job', 'Match', 'Status', 'Update Status'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => {
                    const sc = STATUS_COLORS[app.status] || { bg: '#6b728022', text: '#6b7280' };
                    return (
                      <tr key={app.id}
                        onClick={() => setSelected(selected?.id === app.id ? null : app)}
                        style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: selected?.id === app.id ? 'rgba(139,92,246,0.08)' : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (selected?.id !== app.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (selected?.id !== app.id) e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{app.candidateName || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.candidateEmail || ''}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobTitle || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.jobDepartment || ''}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge ${getScoreClass(app.matchScore)}`}>
                            {(app.matchScore || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
                            {(app.status || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                          <select
                            value={app.status || 'applied'}
                            disabled={updating === app.id}
                            onChange={e => updateStatus(app.id, e.target.value)}
                            style={{ padding: '6px 10px', background: 'rgba(15,18,40,0.9)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}>
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="glass-card" style={{ padding: '20px', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Candidate Detail</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{selected.candidateName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.candidateEmail}</div>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Applied for</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{selected.jobTitle}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected.jobDepartment} · {selected.jobLocation}</div>
            </div>

            {/* Match Score Breakdown */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Match Breakdown</div>
              {[
                { label: 'Overall',       value: selected.matchScore,         color: '#8b5cf6', weight: '—' },
                { label: 'Skills (50%)',  value: selected.skillScore,         color: '#3b82f6', weight: '50%' },
                { label: 'Experience (25%)', value: selected.experienceScore, color: '#10b981', weight: '25%' },
                { label: 'Education (15%)', value: selected.educationScore,   color: '#f59e0b', weight: '15%' },
                { label: 'Certs (10%)',   value: selected.certificationScore, color: '#ec4899', weight: '10%' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color, fontWeight: '600' }}>{(value || 0).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(value || 0, 100)}%`, background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Matched Skills */}
            {selected.matchedSkills?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Matched Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selected.matchedSkills.map(s => (
                    <span key={s} style={{ padding: '3px 8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', fontSize: '11px', color: '#10b981' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Update Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {STATUS_OPTIONS.map(s => {
                  const sc = STATUS_COLORS[s] || { bg: '#6b728022', text: '#6b7280' };
                  const isActive = selected.status === s;
                  return (
                    <button key={s} disabled={updating === selected.id} onClick={() => updateStatus(selected.id, s)}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', border: `1px solid ${isActive ? sc.text : 'var(--glass-border)'}`,
                        background: isActive ? sc.bg : 'rgba(255,255,255,0.02)', color: isActive ? sc.text : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '12px', fontWeight: isActive ? '700' : '400', textAlign: 'left', transition: 'all 0.15s',
                      }}>
                      {isActive ? '✓ ' : ''}{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
