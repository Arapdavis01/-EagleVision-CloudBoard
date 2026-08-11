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
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Server logout failed – clearing local session only');
    } finally {
      localStorage.removeItem('token');
      document.body.classList.remove('app-dashboard');   // 🔥 remove green/gold theme
      location.hash = '#login';
    }
  },
  checkSession: () => api('/api/auth/session'),
};
