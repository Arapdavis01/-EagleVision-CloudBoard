import { api } from './api.js';

export const dashboardService = {
  getKPIs: () => api('/api/dashboard/kpi'),
  getUpcomingReviews: () => api('/api/dashboard/reviews'),
  getStatusDistribution: () => api('/api/dashboard/status-distribution'),
  getPendingRevenue: () => api('/api/dashboard/pending-revenue'),
  getOverdueReviews: () => api('/api/dashboard/overdue-reviews'),
  getCountyBreakdown: () => api('/api/dashboard/county-breakdown'),
  getForSaleProjects: () => api('/api/dashboard/for-sale'),
  getProjectsSummary: () => api('/api/dashboard/projects-summary'),
  getClientsSummary: () => api('/api/dashboard/clients-summary'),
  getRevenueSummary: () => api('/api/dashboard/revenue-summary'),
};
