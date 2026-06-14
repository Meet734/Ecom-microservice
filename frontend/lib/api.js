import axios from 'axios';

// Browser requests go through Next.js rewrites (same origin),
// so baseURL is '' on client. On server (SSR), we need absolute URLs.
const API_BASE = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://auth-service:3001')
  : '';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // Send cookies (refreshToken HttpOnly cookie)
});

// Request Interceptor — attach access token from localStorage
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

// Response Interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh once, and only for 401s
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh uses HttpOnly cookie — no need to send token in body.
        // The cookie is sent automatically because withCredentials: true.
        const { data } = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          {},
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );

        // Backend returns accessToken in the JSON response body
        const newAccessToken = data.accessToken;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        throw new Error('No access token in refresh response');
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined') {
          document.cookie = "auth_status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
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
        api.post('/api/auth/logout'),

    logoutAll: () =>
        api.post('/api/auth/logout-all'),

    refresh: () =>
        api.post('/api/auth/refresh'),

    changePassword: (payload) =>
        api.put('/api/auth/change-password', payload),

    me: () =>
        api.get('/api/auth/me'),

    verify: (token) =>
        api.get('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } }),
};

// User Service API Methods
export const userApi = {
    getProfile: () =>
        api.get('/api/users/me'),

    updateProfile: (payload) =>
        api.put('/api/users/me', payload),

    getAddresses: () =>
        api.get('/api/users/me/addresses'),

    addAddress: (payload) =>
        api.post('/api/users/me/addresses', payload),

    updateAddress: (addressId, payload) =>
        api.put(`/api/users/me/addresses/${addressId}`, payload),

    deleteAddress: (addressId) =>
        api.delete(`/api/users/me/addresses/${addressId}`),
};

// Product Service API Methods
export const productApi = {
    list: (params = {}) =>
        api.get('/api/products', { params }),

    get: (id) =>
        api.get(`/api/products/${id}`),

    create: (payload) =>
        api.post('/api/products', payload),

    update: (id, payload) =>
        api.put(`/api/products/${id}`, payload),

    delete: (id) =>
        api.delete(`/api/products/${id}`),

    search: (params = {}) =>
        api.get('/api/products/search', { params }),

    getCategories: () =>
        api.get('/api/products/categories'),

    createCategory: (payload) =>
        api.post('/api/products/categories', payload),

    deleteCategory: (id) =>
        api.delete(`/api/products/categories/${id}`),
};

// Inventory Service API Methods
export const inventoryApi = {
    get: (productId) =>
        api.get(`/api/inventory/${productId}`),

    initialize: (payload) =>
        api.post('/api/inventory', payload),

    restock: (productId, payload) =>
        api.post(`/api/inventory/${productId}/restock`, payload),
};

// Order Service API Methods
export const orderApi = {
    create: (payload) =>
        api.post('/api/orders', payload),

    list: (params = {}) =>
        api.get('/api/orders', { params }),

    get: (orderId) =>
        api.get(`/api/orders/${orderId}`),

    confirm: (orderId) =>
        api.post(`/api/orders/${orderId}/confirm`),

    cancel: (orderId, payload = {}) =>
        api.post(`/api/orders/${orderId}/cancel`, payload),

    // Admin
    listAll: (params = {}) =>
        api.get('/api/orders/admin/all', { params }),

    updateStatus: (orderId, payload) =>
        api.patch(`/api/orders/${orderId}/status`, payload),
};

export default api;