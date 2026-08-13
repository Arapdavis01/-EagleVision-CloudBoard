import { api } from './api.js';

export const projectService = {
  // Basic project CRUD
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

  // Service Record (project updates)
  getUpdates: (projectId) =>
    api(`/api/projects/${projectId}/updates`),
  createUpdate: (projectId, data) =>
    api(`/api/projects/${projectId}/updates`, { method: 'POST', body: JSON.stringify(data) }),
  updateUpdate: (id, data) =>
    api(`/api/updates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUpdate: (id) =>
    api(`/api/updates/${id}`, { method: 'DELETE' }),
};
