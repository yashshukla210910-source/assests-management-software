import { create } from 'zustand';
import api from '../utils/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const { data } = await api.post('/auth/login', { email, password });
      
      const { user, tokens } = data.data;
      
      // Persist tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.error?.message || error.message || 'Login failed';
      return { success: false, error: message };
    }
  },

  loginWithDid: async (did, signature, nonce) => {
    try {
      set({ isLoading: true });
      const { data } = await api.post('/auth/did-verify', { did, signature, nonce });
      
      const { user, tokens } = data.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.error?.message || error.message || 'DID Login failed';
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        
        // Simple JWT expiry check without a library
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            // Access token expired - will be refreshed on next request by interceptor
            // For now mark as authenticated and let interceptor handle refresh
          }
        } catch {}
        
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  // Update user in state (e.g., after profile update)
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  }
}));
