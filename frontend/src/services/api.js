import { API_BASE_URL } from '../config/constants.js';

export async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include', // keep sending cookies (harmless)
    headers,
    ...options,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
}
