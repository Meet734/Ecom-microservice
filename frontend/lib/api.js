import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const { data } = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API Methods
export const authApi = {
    register: (payload) =>
        api.post('/api/auth/register', payload),

    login: (payload) =>
        api.post('/api/auth/login', payload),

    logout: () =>
        api.post('/api/auth/logout', {
        refreshToken: typeof window !== 'undefined'
            ? localStorage.getItem('refreshToken')
            : null,
        }),

    logoutAll: () =>
        api.post('/api/auth/logout-all'),

    refresh: (refreshToken) =>
        api.post('/api/auth/refresh', { refreshToken }),

    changePassword: (payload) =>
        api.put('/api/auth/change-password', payload),

    me: () =>
        api.get('/api/auth/me'),

    verify: (token) =>
        api.get('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` }, }),
};

export default api;