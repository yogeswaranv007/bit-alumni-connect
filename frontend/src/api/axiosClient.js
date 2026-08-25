import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bit_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data payload and handle unauthenticated sessions
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, clear stale token
      if (error.response.status === 401) {
        const isAuthEndpoint = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
        if (!isAuthEndpoint) {
          localStorage.removeItem('bit_auth_token');
          localStorage.removeItem('bit_auth_user');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
      return Promise.reject(error.response.data || { message: 'An unexpected server error occurred' });
    }
    return Promise.reject({ message: error.message || 'Network error. Please check backend connection.' });
  }
);

export default axiosClient;
