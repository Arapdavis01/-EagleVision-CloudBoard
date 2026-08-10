import { api } from './api.js';

export const authService = {
  login: (email, password) =>
    api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  logout: () =>
    api('/api/auth/logout', { method: 'POST' }),
  checkSession: () =>
    api('/api/auth/session'),
};
