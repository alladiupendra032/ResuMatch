import { useState, useEffect } from 'react';
import { jobsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function HMJobs() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [dept, setDept]       = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await jobsAPI.list({ search, department: dept });
        setJobs(res.data || []);
      } catch {
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, dept]);

  const departments = [...new Set(jobs.map(j => j.department).filter(Boolean))];

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">All Job Postings</h1>
        <p className="page-subtitle">Browse all active job postings across the organisation.</p>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Search jobs..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
        />
        <select value={dept} onChange={e => setDept(e.target.value)}
          style={{ padding: '8px 14px', background: 'rgba(15,18,40,0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {/* Job Cards */}
          <div style={selected ? { display: 'flex', flexDirection: 'column', gap: '12px' } : { display: 'contents' }}>
            {jobs.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                No active jobs found
              </div>
            ) : jobs.map(job => (
              <div key={job.id} className="glass-card"
                onClick={() => setSelected(selected?.id === job.id ? null : job)}
                style={{ padding: '20px', cursor: 'pointer', border: selected?.id === job.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--glass-border)', background: selected?.id === job.id ? 'rgba(139,92,246,0.06)' : undefined, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{job.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.department} · {job.location}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: job.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: job.status === 'active' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                    {job.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {(job.skillsRequired || []).slice(0, 4).map(s => (
                    <span key={s} style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>{s}</span>
                  ))}
                  {(job.skillsRequired || []).length > 4 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{job.skillsRequired.length - 4} more</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>🕐 {job.experienceRequired}+ yrs</span>
                  <span>🎓 {job.educationRequired}</span>
                  <span>💰 {job.salaryRange || 'Not specified'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Job Detail Panel */}
          {selected && (
            <div className="glass-card" style={{ padding: '24px', height: 'fit-content', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Job Details</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{selected.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.department} · {selected.location}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Salary', value: selected.salaryRange || 'Not specified' },
                  { label: 'Experience', value: `${selected.experienceRequired}+ years` },
                  { label: 'Education', value: selected.educationRequired },
                  { label: 'Status', value: selected.status },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Required Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(selected.skillsRequired || []).map(s => (
                    <span key={s} style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '12px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>{s}</span>
                  ))}
                </div>
              </div>

              {selected.certificationsRequired?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Required Certifications</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selected.certificationsRequired.map(c => (
                      <span key={c} style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '12px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Description</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>{selected.description}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
