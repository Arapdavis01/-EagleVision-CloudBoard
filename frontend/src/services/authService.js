import { api } from './api.js';

export const authService = {
  login: async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
  logout: async () => {
    try {
      // Call server to clear cookie (token still present for auth)
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Even if server fails, we still want to log out locally
      console.warn('Server logout failed – clearing local session only');
    } finally {
      // Remove token and redirect instantly
      localStorage.removeItem('token');
      location.hash = '#login';
    }
  },
  checkSession: () => api('/api/auth/session'),
};
