import axios from 'axios';

const api = axios.create({
  baseURL: 'http://49.13.68.62:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API DEBUG] Added Authorization header with token');
    } else {
      console.log('[API DEBUG] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[API DEBUG] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor to handle responses
api.interceptors.response.use(
  (response) => {
    console.log('[API DEBUG] Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API DEBUG] Response error:', error.response?.status, error.message, error.config?.url);
    if (error.response && error.response.status === 401) {
      console.warn('[API DEBUG] 401 Unauthorized detected');
      if (error.config.url.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        if (typeof window !== 'undefined') {
          const currentRole = localStorage.getItem('role') || 'client';
          window.location.href = `/login?role=${currentRole}&sessionExpired=true`;
        }
      }
    } else if (!error.response) {
      console.error('[API DEBUG] Network error or server unreachable:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;