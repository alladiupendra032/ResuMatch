import { useState, useEffect } from 'react';
import { jobsAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const BLANK_JOB = {
  title: '', department: '', experienceRequired: 0, skillsRequired: [],
  location: '', salaryRange: '', description: '', educationRequired: '',
  certificationsRequired: [],
};

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(BLANK_JOB);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await jobsAPI.myJobs();
      setJobs(res.data);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => { setForm(BLANK_JOB); setSkillInput(''); setEditingJob(null); setShowForm(true); };
  const openEdit = (job) => {
    setForm({ ...job, skillsRequired: job.skillsRequired || [], certificationsRequired: job.certificationsRequired || [] });
    setSkillInput('');
    setEditingJob(job);
    setShowForm(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skillsRequired.includes(s)) {
      setForm({ ...form, skillsRequired: [...form.skillsRequired, s] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => setForm({ ...form, skillsRequired: form.skillsRequired.filter(s => s !== skill) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingJob) {
        await jobsAPI.update(editingJob.id, form);
        toast.success('Job updated successfully!');
      } else {
        await jobsAPI.create(form);
        toast.success('Job posted successfully!');
      }
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save job');
    } finally { setSaving(false); }
  };

  const handleArchive = async (jobId) => {
    if (!confirm('Archive this job? Candidates will no longer see it.')) return;
    try {
      await jobsAPI.archive(jobId);
      toast.success('Job archived');
      fetchJobs();
    } catch { toast.error('Failed to archive job'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Manage Jobs</h1>
          <p className="page-subtitle">Create, edit, and manage your job postings.</p>
        </div>
        <button id="create-job-btn" className="btn btn-primary" onClick={openCreate}>
          ➕ Post New Job
        </button>
      </div>

      {/* Job Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-card-static" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="font-bold text-lg">{editingJob ? 'Edit Job' : 'Post New Job'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form id="job-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input id="job-title" name="title" className="form-input" placeholder="e.g. Python Developer" value={form.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input id="job-department" name="department" className="form-input" placeholder="e.g. Engineering" value={form.department} onChange={handleChange} />
                </div>
              </div>
              <div className="grid-2" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input id="job-loc" name="location" className="form-input" placeholder="e.g. Remote / Bangalore" value={form.location} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Range</label>
                  <input id="job-salary" name="salaryRange" className="form-input" placeholder="e.g. $80k – $110k" value={form.salaryRange} onChange={handleChange} />
                </div>
              </div>
              <div className="grid-2" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Experience Required (years)</label>
                  <input id="job-exp" name="experienceRequired" type="number" min="0" step="0.5" className="form-input" value={form.experienceRequired} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Education Required</label>
                  <select id="job-edu" name="educationRequired" className="form-input" value={form.educationRequired} onChange={handleChange}>
                    <option value="">Any</option>
                    <option value="high school">High School</option>
                    <option value="diploma">Diploma / Associate</option>
                    <option value="bachelor">Bachelor's / B.Tech</option>
                    <option value="master">Master's / MBA</option>
                    <option value="phd">PhD / Doctorate</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input id="skill-input" className="form-input" placeholder="Type skill and press Add..." value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <button type="button" className="btn btn-ghost" onClick={addSkill}>Add</button>
                </div>
                {form.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.skillsRequired.map(skill => (
                      <span key={skill} className="skill-tag" style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)}>
                        {skill} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea id="job-desc" name="description" className="form-input" placeholder="Describe the role, responsibilities, and requirements..." value={form.description} onChange={handleChange} rows={5} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button id="job-submit-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Saving...</> : editingJob ? 'Update Job' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state glass-card-static p-8">
          <div className="empty-icon">💼</div>
          <h3 className="font-semibold text-lg mb-2">No Jobs Posted</h3>
          <p className="text-muted text-sm mb-4">Create your first job posting to start receiving applications.</p>
          <button className="btn btn-primary" onClick={openCreate}>Post Your First Job</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {jobs.map(job => (
            <div key={job.id} className="glass-card p-5">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{job.title}</h3>
                    <span className={`badge ${job.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{job.status}</span>
                    {job.department && <span className="badge badge-purple">{job.department}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {job.location && <span className="text-sm text-muted">📍 {job.location}</span>}
                    {job.salaryRange && <span className="text-sm text-muted">💰 {job.salaryRange}</span>}
                    {job.experienceRequired > 0 && <span className="text-sm text-muted">⏱ {job.experienceRequired}+ yrs</span>}
                    <span className="text-sm text-muted">📅 {formatDate(job.created_at)}</span>
                  </div>
                  {job.skillsRequired?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.skillsRequired.map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button id={`edit-job-${job.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(job)}>✏️ Edit</button>
                  {job.status === 'active' && (
                    <button id={`archive-job-${job.id}`} className="btn btn-danger btn-sm" onClick={() => handleArchive(job.id)}>🗄️ Archive</button>
                  )}
                  <a href="/recruiter/applicants" className="btn btn-ghost btn-sm">👥 View Applicants</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
