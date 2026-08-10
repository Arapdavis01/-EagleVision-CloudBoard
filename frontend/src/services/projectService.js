import { api } from './api.js';

export const projectService = {
  getAll: (search = '') =>
    api(`/api/projects?search=${encodeURIComponent(search)}`),
  getOne: (id) =>
    api(`/api/projects/${id}`),
  create: (data) =>
    api('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    api(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    api(`/api/projects/${id}`, { method: 'DELETE' }),
};
