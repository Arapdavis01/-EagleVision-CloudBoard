import { api } from './api.js';

export const uptimeService = {
  getAlerts: () => api('/api/alerts'),
  resolveAlert: (projectId) =>
    api(`/api/alerts/${projectId}/resolve`, { method: 'POST' }),
  getLogs: (projectId) =>
    api(`/api/uptime/logs?project_id=${projectId}`),
};
