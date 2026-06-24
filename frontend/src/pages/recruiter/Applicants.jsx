import { useState, useEffect } from 'react';
import { applicationsAPI, jobsAPI } from '../../services/api';
import { getStatusClass, getStatusLabel, getMatchClass, formatDate } from '../../utils/helpers';
import { API_BASE } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'];

export default function RecruiterApplicants() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ jobId: '', minScore: '', maxScore: '', status: '', sortBy: 'matchScore' });
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.jobId) params.job_id = filters.jobId;
      if (filters.minScore) params.min_score = filters.minScore;
      if (filters.maxScore) params.max_score = filters.maxScore;
      if (filters.status) params.status = filters.status;
      if (filters.sortBy) params.sort_by = filters.sortBy;

      const [appsRes, jobsRes] = await Promise.all([
        applicationsAPI.list(params),
        jobsAPI.myJobs(),
      ]);
      setApplications(appsRes.data);
      setJobs(jobsRes.data);
    } catch { toast.error('Failed to load applicants'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleStatusUpdate = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast.success(`Status updated to "${getStatusLabel(newStatus)}"`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    } finally { setUpdatingId(null); }
  };

  const rankColor = (rank) => {
    if (!rank) return '#64748b';
    if (rank.toLowerCase().includes('excellent')) return '#10b981';
    if (rank.toLowerCase().includes('good')) return '#06b6d4';
    if (rank.toLowerCase().includes('moderate')) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Applicants</h1>
        <p className="page-subtitle">Review, filter, and manage all candidate applications.</p>
      </div>

      {/* Filters */}
      <div className="glass-card-static p-4 mb-6">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
            <label className="form-label">Filter by Job</label>
            <select id="filter-job" name="jobId" className="form-input" value={filters.jobId} onChange={handleFilterChange}>
              <option value="">All Jobs</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
            <label className="form-label">Min Score %</label>
            <input id="filter-min" name="minScore" type="number" min="0" max="100" className="form-input" placeholder="0" value={filters.minScore} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
            <label className="form-label">Max Score %</label>
            <input id="filter-max" name="maxScore" type="number" min="0" max="100" className="form-input" placeholder="100" value={filters.maxScore} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
            <label className="form-label">Status</label>
            <select id="filter-status" name="status" className="form-input" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
            <label className="form-label">Sort By</label>
            <select id="filter-sort" name="sortBy" className="form-input" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="matchScore">Match Score</option>
              <option value="created_at">Latest First</option>
            </select>
          </div>
          <button id="apply-filters-btn" className="btn btn-primary" onClick={fetchData}>Apply Filters</button>
        </div>
      </div>

      {/* Results count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span className="text-sm text-muted">
          {applications.length} applicant{applications.length !== 1 ? 's' : ''} found
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Excellent', 'Good', 'Moderate', 'Low'].map(label => {
            const count = applications.filter(a => a.matchRank?.includes(label)).length;
            return count > 0 ? (
              <span key={label} className={`badge match-${label.toLowerCase()}`}>{label}: {count}</span>
            ) : null;
          })}
        </div>
      </div>

      {/* Applicant Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No applicants found with the current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {applications.map(app => {
            const isExpanded = expandedId === app.id;
            const isUpdating = updatingId === app.id;
            return (
              <div key={app.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Score bar accent */}
                <div style={{ height: '3px', background: `linear-gradient(90deg, ${rankColor(app.matchRank)}, transparent)` }} />

                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Left: Candidate info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {app.candidateName || 'Candidate'}
                        </h3>
                        {app.matchScore != null && (
                          <span className={`badge ${getMatchClass(app.matchRank)}`} style={{ fontSize: '12px' }}>
                            {app.matchScore.toFixed(0)}% · {app.matchRank}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {app.candidateEmail && <span className="text-xs text-muted">📧 {app.candidateEmail}</span>}
                        {app.candidateExperience > 0 && <span className="text-xs text-muted">⏱ {app.candidateExperience} yrs exp</span>}
                        {app.jobTitle && <span className="text-xs text-muted">💼 {app.jobTitle}</span>}
                        <span className="text-xs text-muted">📅 {formatDate(app.created_at)}</span>
                      </div>
                      {app.candidateSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app.candidateSkills.slice(0, 5).map(s => <span key={s} className="skill-tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{s}</span>)}
                          {app.candidateSkills.length > 5 && <span className="text-xs text-muted">+{app.candidateSkills.length - 5} more</span>}
                        </div>
                      )}
                    </div>

                    {/* Right: Status + Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '180px' }}>
                      <select
                        id={`status-${app.id}`}
                        className="form-input"
                        style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
                        value={app.status}
                        disabled={isUpdating}
                        onChange={e => handleStatusUpdate(app.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        {app.resumeUrl && (
                          <a href={`${API_BASE}${app.resumeUrl}`} target="_blank" rel="noreferrer"
                            className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                            📥 Resume
                          </a>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        >
                          {isExpanded ? '▲ Less' : '▼ More'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Score breakdown */}
                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)', animation: 'fadeIn 0.2s ease-out' }}>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {[
                          { label: '🎯 Skills', value: app.skillScore },
                          { label: '💼 Experience', value: app.experienceScore },
                          { label: '🎓 Education', value: app.educationScore },
                          { label: '📜 Certs', value: app.certificationScore },
                        ].map(({ label, value }) => value != null && (
                          <div key={label} style={{ flex: 1, minWidth: '90px', padding: '10px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                            <div className="text-xs text-muted mb-1">{label}</div>
                            <div className="font-bold" style={{ fontSize: '18px', color: value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {value.toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                      {app.matchedSkills?.length > 0 && (
                        <div>
                          <span className="text-xs text-muted">Matched skills: </span>
                          {app.matchedSkills.map(s => (
                            <span key={s} className="badge badge-green" style={{ marginLeft: '4px', fontSize: '10px' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
