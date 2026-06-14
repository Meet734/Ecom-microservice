import { create } from 'zustand';
import api from '@/lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Register user
  register: async (email, password, role, name) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/auth/register', { email, password, role, name });
      // Backend sends refreshToken as HttpOnly cookie (automatic via withCredentials).
      // JSON body contains: { success, user, accessToken }
      const { user, accessToken } = data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        document.cookie = "auth_status=true; path=/; max-age=604800; SameSite=Lax";
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      // Backend sends refreshToken as HttpOnly cookie (automatic via withCredentials).
      // JSON body contains: { success, user, accessToken }
      const { user, accessToken } = data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        document.cookie = "auth_status=true; path=/; max-age=604800; SameSite=Lax";
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.put('/api/auth/change-password', { oldPassword, newPassword });
      set({ isLoading: false });
      get().logout(); // Clear local storage & cookie since all sessions are revoked
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to change password';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Logout
  logout: () => {
    // Fire-and-forget server logout (to invalidate refresh token cookie)
    api.post('/api/auth/logout').catch(() => {});
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      document.cookie = "auth_status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Set user
  setUser: (user) => set({ user }),
  
  // Set access token
  setAccessToken: (accessToken) => {
    set({ accessToken });
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
    }
  },

  // Hydrate from localStorage
  hydrate: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (user && accessToken) {
        set({
          user: JSON.parse(user),
          accessToken,
          isAuthenticated: true,
        });
      }
    }
  },
}));

export default useAuthStore;
