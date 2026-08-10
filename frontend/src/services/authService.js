import { api } from './api.js';

export const authService = {
  login: async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    // Store token in localStorage (frontend will send it with every request)
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
    return api('/api/auth/logout', { method: 'POST' });
  },
  checkSession: () => api('/api/auth/session'),
};
