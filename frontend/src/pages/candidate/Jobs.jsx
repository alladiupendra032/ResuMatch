import { useState, useEffect } from 'react';
import { jobsAPI, applicationsAPI } from '../../services/api';
import { truncate, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function CandidateJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [applying, setApplying] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (location) params.location = location;
      const res = await jobsAPI.list(params);
      setJobs(res.data);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplied = async () => {
    try {
      const res = await applicationsAPI.list();
      setAppliedJobs(new Set(res.data.map(a => a.jobId)));
    } catch {}
  };

  useEffect(() => {
    fetchJobs();
    fetchApplied();
  }, []);

  const handleApply = async (jobId) => {
    setApplying(jobId);
    try {
      const res = await applicationsAPI.apply(jobId);
      setAppliedJobs(prev => new Set([...prev, jobId]));
      const score = res.data.application?.matchScore;
      const rank = res.data.application?.matchRank;
      toast.success(`Applied! Your match score: ${score?.toFixed(0)}% (${rank})`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Browse Jobs</h1>
        <p className="page-subtitle">Find your perfect opportunity and apply with one click.</p>
      </div>

      {/* Filters */}
      <div className="glass-card-static p-4 mb-6">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
            <label className="form-label">Search Jobs</label>
            <input id="job-search" className="form-input" placeholder="Job title, skills, keywords..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchJobs()} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label">Department</label>
            <input id="job-dept" className="form-input" placeholder="e.g. Engineering"
              value={department} onChange={e => setDepartment(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label">Location</label>
            <input id="job-location" className="form-input" placeholder="e.g. Remote"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <button id="job-search-btn" className="btn btn-primary" onClick={fetchJobs}>
            🔍 Search
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No jobs found. Try different keywords.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {jobs.map((job) => {
            const isApplied = appliedJobs.has(job.id);
            const isApplying = applying === job.id;
            return (
              <div key={job.id} className="glass-card p-6" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{job.title}</h3>
                      {job.department && <span className="badge badge-purple">{job.department}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {job.location && <span className="text-sm text-muted">📍 {job.location}</span>}
                      {job.salaryRange && <span className="text-sm text-muted">💰 {job.salaryRange}</span>}
                      {job.experienceRequired > 0 && <span className="text-sm text-muted">⏱ {job.experienceRequired}+ yrs</span>}
                      <span className="text-sm text-muted">📅 {formatDate(job.created_at)}</span>
                    </div>
                    {job.description && (
                      <p className="text-sm text-muted" style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                        {truncate(job.description, 180)}
                      </p>
                    )}
                    {job.skillsRequired?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skillsRequired.slice(0, 6).map(skill => (
                          <span key={skill} className="skill-tag">{skill}</span>
                        ))}
                        {job.skillsRequired.length > 6 && (
                          <span className="badge badge-gray">+{job.skillsRequired.length - 6} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px', alignItems: 'flex-end' }}>
                    <button
                      id={`apply-${job.id}`}
                      className={`btn ${isApplied ? 'btn-ghost' : 'btn-primary'}`}
                      disabled={isApplied || isApplying}
                      onClick={() => !isApplied && handleApply(job.id)}
                    >
                      {isApplying ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Applying...</>
                        : isApplied ? '✓ Applied'
                        : '⚡ Apply Now'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    >
                      {selectedJob?.id === job.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedJob?.id === job.id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: '12px' }}>
                      {job.description}
                    </p>
                    {job.educationRequired && (
                      <div className="text-sm text-muted mb-2">
                        🎓 Education Required: <strong style={{ color: 'var(--text-primary)' }}>{job.educationRequired}</strong>
                      </div>
                    )}
                    {job.certificationsRequired?.length > 0 && (
                      <div className="text-sm text-muted">
                        📜 Certifications: {job.certificationsRequired.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
