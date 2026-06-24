import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resumatch_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('resumatch_token');
      localStorage.removeItem('resumatch_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
};

// ─── Resume ──────────────────────────────────────────────────────────────
export const resumeAPI = {
  upload: (formData) => api.post('/api/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyProfile: () => api.get('/api/resume/me'),
  getById: (id) => api.get(`/api/resume/${id}`),
  delete: (id) => api.delete(`/api/resume/${id}`),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────
export const jobsAPI = {
  list: (params) => api.get('/api/jobs/', { params }),
  myJobs: () => api.get('/api/jobs/recruiter/my-jobs'),
  getById: (id) => api.get(`/api/jobs/${id}`),
  create: (data) => api.post('/api/jobs/', data),
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  archive: (id) => api.delete(`/api/jobs/${id}`),
};

// ─── Applications ────────────────────────────────────────────────────────
export const applicationsAPI = {
  apply: (jobId) => api.post('/api/apply', { jobId }),
  list: (params) => api.get('/api/applications', { params }),
  getById: (id) => api.get(`/api/applications/${id}`),
  updateStatus: (id, status) => api.patch(`/api/applications/${id}/status`, { status }),
};

// ─── Analytics ──────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getRecruiterAnalytics: () => api.get('/api/recruiter/analytics'),
  getSummary:            () => api.get('/api/recruiter/analytics'),  // alias used by HM dashboard
};

export const API_BASE = API_BASE_URL;
export default api;
