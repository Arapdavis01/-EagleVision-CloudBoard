import { api } from './api.js';

export const salesService = {
  getAll: () => api('/api/sales'),
  create: (data) => api('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => api(`/api/sales/${id}`, { method: 'DELETE' }),
};
