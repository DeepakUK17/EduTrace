import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edutrace_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session timeouts, 401, and 403 Access Denied
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorMsg = String(error.response?.data?.error || '');

    if (status === 401 || status === 403 || errorMsg.toLowerCase().includes('access denied')) {
      const url = error.config?.url || '';
      // Don't auto-redirect if we're attempting to login or checking public verify
      if (!url.includes('/auth/login') && !url.includes('/verify/')) {
        localStorage.removeItem('edutrace_token');
        localStorage.removeItem('edutrace_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          const reason = status === 403 || errorMsg.toLowerCase().includes('access denied') ? 'denied' : 'expired';
          window.location.href = `/login?${reason}=true`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
