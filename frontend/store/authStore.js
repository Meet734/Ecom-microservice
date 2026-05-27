import { create } from 'zustand';
import api from '@/lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Register user
  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { email, password, name });
      const { user, accessToken, refreshToken } = data;
      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = data;
      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
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
      await api.put('/auth/change-password', { oldPassword, newPassword });
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to change password';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Logout
  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Set user
  setUser: (user) => set({ user }),
  
  // Set tokens
  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Hydrate from localStorage
  hydrate: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (user && accessToken) {
        set({
          user: JSON.parse(user),
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      }
    }
  },
}));

export default useAuthStore;
