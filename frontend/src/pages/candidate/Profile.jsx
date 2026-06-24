import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { resumeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000';

export default function CandidateProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await resumeAPI.getMyProfile();
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max size is 10MB.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await resumeAPI.upload(formData);
      toast.success('Resume uploaded & parsed successfully!');
      await fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    disabled: uploading,
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Upload your resume to automatically populate your profile.</p>
      </div>

      {/* Upload Zone */}
      <div className="glass-card-static p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Resume Upload</h2>
        <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`} id="resume-dropzone">
          <input {...getInputProps()} id="resume-file-input" />
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px', borderColor: 'rgba(124,58,237,0.3)', borderTopColor: 'var(--accent-primary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Parsing your resume with AI...</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                {isDragActive ? '📂' : '📄'}
              </div>
              <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '6px' }}>
                {isDragActive ? 'Drop your resume here!' : 'Drag & drop your resume here'}
              </p>
              <p className="text-sm text-muted">or click to browse • PDF, DOCX supported • Max 10MB</p>
              {profile?.resumeUrl && (
                <div style={{ marginTop: '12px' }}>
                  <span className="badge badge-green">✓ Resume uploaded</span>
                </div>
              )}
            </>
          )}
        </div>
        {profile?.resumeUrl && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href={`${API_BASE}${profile.resumeUrl}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              📥 View Resume
            </a>
            <span className="text-sm text-muted">Re-upload to update your profile</span>
          </div>
        )}
      </div>

      {profile ? (
        <div className="grid-2">
          {/* Contact Info */}
          <div className="glass-card-static p-6">
            <h2 className="font-semibold text-lg mb-4">Contact Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <InfoRow icon="👤" label="Name" value={profile.name || user?.name} />
              <InfoRow icon="📧" label="Email" value={profile.email || user?.email} />
              <InfoRow icon="📞" label="Phone" value={profile.phone || 'Not extracted'} />
              <InfoRow icon="💼" label="Experience" value={`${profile.experience_years || 0} years`} />
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card-static p-6">
            <h2 className="font-semibold text-lg mb-4">
              Extracted Skills
              <span className="badge badge-purple" style={{ marginLeft: '8px' }}>{profile.skills?.length || 0}</span>
            </h2>
            {profile.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No skills extracted yet. Upload your resume.</p>
            )}
          </div>

          {/* Education */}
          {profile.education?.length > 0 && (
            <div className="glass-card-static p-6">
              <h2 className="font-semibold text-lg mb-4">Education</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profile.education.map((edu, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{edu.degree}</div>
                    {edu.institution && <div className="text-sm text-muted">{edu.institution}</div>}
                    {edu.year && <div className="text-xs text-muted mt-2">{edu.year}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications?.length > 0 && (
            <div className="glass-card-static p-6">
              <h2 className="font-semibold text-lg mb-4">Certifications</h2>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert) => (
                  <span key={cert} className="badge badge-cyan">{cert}</span>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {profile.projects?.length > 0 && (
            <div className="glass-card-static p-6" style={{ gridColumn: '1 / -1' }}>
              <h2 className="font-semibold text-lg mb-4">Projects</h2>
              <div className="grid-2">
                {profile.projects.map((proj, i) => (
                  <div key={i} style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{proj.title}</div>
                    {proj.description && <div className="text-sm text-muted mt-2">{proj.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card-static p-8 text-center">
          <div className="empty-icon">🚀</div>
          <h3 className="font-semibold text-lg mb-2">No Profile Yet</h3>
          <p className="text-muted text-sm">Upload your resume above and our AI will automatically extract your skills, experience, and education.</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value || 'N/A'}</div>
      </div>
    </div>
  );
}
