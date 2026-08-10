import { API_BASE_URL } from '../../config/constants.js';

export async function publicStatusPage() {
  const app = document.getElementById('app');
  const token = new URLSearchParams(location.search).get('token');
  if (!token) {
    app.innerHTML = `<p>Invalid link. No token provided.</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/public/status/${token}`);
    if (!res.ok) throw new Error('Project not found');
    const { project, latest_uptime } = await res.json();
    
    app.innerHTML = `
      <div class="public-status">
        <h1>${escapeHtml(project.name)}</h1>
        <p><strong>Status:</strong> <span class="status ${project.status.toLowerCase()}">${project.status}</span></p>
        <p><strong>Client:</strong> ${escapeHtml(project.client) || '—'}</p>
        ${latest_uptime ? `
          <p><strong>Last checked:</strong> ${new Date(latest_uptime.checked_at).toLocaleString()}</p>
          <p><strong>Up:</strong> ${latest_uptime.is_up ? '✅' : '❌'}</p>
        ` : ''}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<p>Error loading public status: ${err.message}</p>`;
  }
}
