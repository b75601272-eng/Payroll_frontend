import axios from 'axios';

// ── Smart API URL detection ──────────────────────────────
// Priority: env variable → Render auto-detect → proxy
function getBaseURL() {
  // 1. Explicit env variable (set this in Vercel/Netlify/Render)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // 2. If running on Vercel/Netlify, same-origin API won't work
  //    User must set REACT_APP_API_URL
  // 3. Fallback: use proxy (works in local dev + Codespaces)
  return '/api';
}

const BASE_URL = getBaseURL();
console.log('[API] Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor — unwrap data, extract error message
api.interceptors.response.use(
  response => response.data,
  error => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error — check backend is running';
    console.error('[API Error]', message, error.config?.url);
    return Promise.reject(new Error(message));
  }
);

// ── API methods ──────────────────────────────────────────
export const employeeAPI = {
  getAll:   (params) => api.get('/employees', { params }),
  getById:  (id)     => api.get(`/employees/${id}`),
  create:   (data)   => api.post('/employees', data),
  update:   (id, d)  => api.put(`/employees/${id}`, d),
  delete:   (id)     => api.delete(`/employees/${id}`)
};

export const payrollAPI = {
  getAll:      (params) => api.get('/payroll', { params }),
  generate:    (data)   => api.post('/payroll/generate', data),
  updateStatus:(id, d)  => api.patch(`/payroll/${id}/status`, d),
  getSlipUrl:  (id)     => `${BASE_URL}/payroll/${id}/slip`,
  getReports:  (params) => api.get('/payroll/reports/summary', { params })
};

export const departmentAPI = {
  getAll:  ()       => api.get('/departments'),
  create:  (data)   => api.post('/departments', data),
  update:  (id, d)  => api.put(`/departments/${id}`, d),
  delete:  (id)     => api.delete(`/departments/${id}`)
};

export const taxAPI = {
  getAll:  ()       => api.get('/tax-settings'),
  create:  (data)   => api.post('/tax-settings', data),
  update:  (id, d)  => api.put(`/tax-settings/${id}`, d),
  delete:  (id)     => api.delete(`/tax-settings/${id}`)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard')
};

export default api;
