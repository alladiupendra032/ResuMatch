import { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import { getStatusClass, getStatusLabel, getMatchClass, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function CandidateApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchApps = async () => {
    try {
      const res = await applicationsAPI.list();
      setApplications(res.data);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'applied', label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview', label: 'Interview' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">Track the status of every job you've applied to.</p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            id={`filter-${f.value}`}
            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === 'all' && <span className="badge badge-gray" style={{ marginLeft: '4px' }}>{applications.length}</span>}
            {f.value !== 'all' && applications.filter(a => a.status === f.value).length > 0 && (
              <span className="badge badge-gray" style={{ marginLeft: '4px' }}>
                {applications.filter(a => a.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>{filter === 'all' ? "You haven't applied to any jobs yet." : `No ${filter.replace('_', ' ')} applications.`}</p>
          {filter === 'all' && <a href="/candidate/jobs" className="btn btn-primary mt-4">Browse Jobs</a>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {filtered.map(app => (
            <div key={app.id} className="glass-card p-5">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                {/* Job info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {app.jobTitle || 'Job Position'}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {app.jobDepartment && <span className="text-sm text-muted">🏢 {app.jobDepartment}</span>}
                    {app.jobLocation && <span className="text-sm text-muted">📍 {app.jobLocation}</span>}
                    <span className="text-sm text-muted">📅 Applied {formatDate(app.created_at)}</span>
                  </div>
                </div>

                {/* Score + Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={`font-bold text-sm ${getStatusClass(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                  {app.matchScore != null && (
                    <span className={`badge ${getMatchClass(app.matchRank)}`}>
                      {app.matchScore.toFixed(0)}% Match
                    </span>
                  )}
                </div>
              </div>

              {/* Score breakdown */}
              {app.matchScore != null && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ScorePill label="Skills" value={app.skillScore} />
                    <ScorePill label="Experience" value={app.experienceScore} />
                    <ScorePill label="Education" value={app.educationScore} />
                    <ScorePill label="Certs" value={app.certificationScore} />
                  </div>
                  {app.matchedSkills?.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="text-xs text-muted">Matched skills:</span>
                      {app.matchedSkills.map(s => (
                        <span key={s} className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pipeline progress bar */}
              <PipelineBar status={app.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value }) {
  if (value == null) return null;
  return (
    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '4px 10px', textAlign: 'center' }}>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value?.toFixed(0)}%</div>
    </div>
  );
}

const PIPELINE_STAGES = ['applied', 'under_review', 'shortlisted', 'interview', 'selected'];

function PipelineBar({ status }) {
  if (status === 'rejected') {
    return (
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '4px', background: 'rgba(239,68,68,0.3)', borderRadius: '2px' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--accent-red)', borderRadius: '2px' }} />
        </div>
        <span className="text-xs" style={{ color: 'var(--accent-red)' }}>Rejected</span>
      </div>
    );
  }
  const currentIdx = PIPELINE_STAGES.indexOf(status);
  const progress = ((currentIdx + 1) / PIPELINE_STAGES.length) * 100;
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        {PIPELINE_STAGES.map((stage, i) => (
          <span key={stage} className="text-xs" style={{
            color: i <= currentIdx ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: i === currentIdx ? '700' : '400'
          }}>
            {stage.replace('_', ' ')}
          </span>
        ))}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
