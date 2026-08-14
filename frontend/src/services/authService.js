import { api } from './api.js';

export const authService = {
  // Email/password login
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

  // Standard logout
  logout: async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Server logout failed – clearing local session only');
    } finally {
      localStorage.removeItem('token');
      document.body.classList.remove('app-dashboard');
      location.hash = '#login';
    }
  },

  // Check current session
  checkSession: () => api('/api/auth/session'),

  // ==================== QR CODE LOGIN ====================

  // Step 1: Create a new QR login session (called from laptop login page)
  generateLoginSession: () =>
    api('/api/auth/qr/session', { method: 'POST' }),

  // Step 2: Poll session status (called by laptop)
  checkLoginSessionStatus: (sessionToken) =>
    api(`/api/auth/qr/session/${sessionToken}/status`),

  // Step 3: Approve session from phone (no auth, only PIN required)
  approveLoginSession: (sessionToken, pin) =>
    api(`/api/auth/qr/session/${sessionToken}/approve`, {
      method: 'POST',
      body: JSON.stringify({ pin })
    }),
};
