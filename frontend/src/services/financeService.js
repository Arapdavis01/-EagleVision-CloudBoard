import { api } from './api.js';

export const financeService = {
  // Revenue (sales)
  getRevenue: () => api('/api/finance/revenue'),
  createRevenue: (data) => api('/api/finance/revenue', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRevenue: (id, data) => api(`/api/finance/revenue/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteRevenue: (id) => api(`/api/finance/revenue/${id}`, {
    method: 'DELETE',
  }),
  getRevenueSummary: () => api('/api/finance/revenue/summary'),

  // Expenses
  getExpenses: () => api('/api/finance/expenses'),
  getExpensesByProject: (projectId) => api(`/api/finance/expenses/by-project/${projectId}`),
  createExpense: (data) => api('/api/finance/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateExpense: (id, data) => api(`/api/finance/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteExpense: (id) => api(`/api/finance/expenses/${id}`, {
    method: 'DELETE',
  }),
  getExpenseSummary: () => api('/api/finance/expenses/summary'),

  // Net income
  getNetIncome: () => api('/api/finance/net-income'),
};
