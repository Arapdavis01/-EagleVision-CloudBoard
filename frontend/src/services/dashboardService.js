import { api } from './api.js';

export const dashboardService = {
  getKPIs: () => api('/api/dashboard/kpi'),
  getUpcomingReviews: () => api('/api/dashboard/reviews'),
};
