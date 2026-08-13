import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { uptimeService } from '../../services/uptimeService.js';
import { projectService } from '../../services/projectService.js';
import { dashboardService } from '../../services/dashboardService.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../utils/notifications.js';

export async function alertsPage() {
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="alerts-header">
        <h2>Alerts</h2>
        <button id="refresh-alerts-btn" class="btn btn-outline"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>

      <!-- KPI Cards -->
      <div id="alerts-kpi-container" class="kpi-grid">
        ${renderAlertPlaceholderKPIs()}
      </div>

      <!-- Filters -->
      <div class="alerts-toolbar">
        <input type="text" id="alerts-search" placeholder="Search by project or client...">
        <button id="clear-alerts-search-btn" class="btn btn-outline btn-sm"><i class="fas fa-times"></i> Clear</button>
      </div>

      <!-- Alerts Table (Uptime) -->
      <div class="table-container card">
        <table id="alerts-table" class="summary-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="name">Project <i class="fas fa-sort"></i></th>
              <th class="sortable" data-sort="client">Client <i class="fas fa-sort"></i></th>
              <th>Status</th>
              <th class="sortable" data-sort="checked_at">Last Checked <i class="fas fa-sort"></i></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="alerts-tbody">
            <tr><td colspan="5" class="empty-state">Loading uptime alerts…</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state (hidden by default) -->
      <div id="alerts-empty-state" class="empty-state hidden">
        <i class="fas fa-check-circle fa-3x" style="color:var(--success)"></i>
        <p>All systems are up. No down projects.</p>
      </div>

      <hr class="section-divider" style="margin: 1.5rem 0;">

      <!-- Domain Expiry Alerts Section -->
      <div class="alerts-header">
        <h3><i class="fas fa-globe"></i> Domain Expiry Alerts</h3>
      </div>
      <div class="table-container card">
        <table id="domain-expiry-table" class="summary-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Domain</th>
              <th>Registrar</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
            </tr>
          </thead>
          <tbody id="domain-expiry-tbody">
            <tr><td colspan="5" class="empty-state">Loading domain expiries…</td></tr>
          </tbody>
        </table>
      </div>
      <div id="domain-expiry-empty" class="empty-state hidden">
        <i class="fas fa-calendar-check fa-3x" style="color:var(--success)"></i>
        <p>No domains expiring soon.</p>
      </div>
    </div>
  `;

  initSidebar();

  // State
  let alerts = [];
  let projects = [];
  let expiringDomains = [];
  let sortField = 'checked_at';
  let sortDir = 'desc';
  let searchTerm = '';

  const tbody = document.getElementById('alerts-tbody');
  const emptyState = document.getElementById('alerts-empty-state');
  const kpiContainer = document.getElementById('alerts-kpi-container');
  const searchInput = document.getElementById('alerts-search');
  const domainTbody = document.getElementById('domain-expiry-tbody');
  const domainEmpty = document.getElementById('domain-expiry-empty');

  // Helpers
  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  function renderAlertPlaceholderKPIs() {
    return ['Down Projects','Total Monitored','Avg Response Time','Last 24h Alerts']
      .map((title, i) => {
        const icons = ['fa-exclamation-triangle','fa-globe','fa-clock','fa-history'];
        return `<div class="card kpi-card compact-kpi"><i class="fas ${icons[i]} kpi-icon"></i><h3>${title}</h3><div class="value">--</div></div>`;
      }).join('');
  }

  async function loadAlerts() {
    try {
      [alerts, projects, expiringDomains] = await Promise.all([
        uptimeService.getAlerts(),
        projectService.getAll().catch(() => []),
        dashboardService.getExpiringDomains().catch(() => []),
      ]);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      showToast('Failed to load alerts.', 'error');
      alerts = [];
      projects = [];
      expiringDomains = [];
    }

    updateKPIs(alerts, projects);
    applyFiltersAndSort();
    renderDomainExpiryTable();
  }

  function updateKPIs(alertsList, projectList) {
    const totalMonitored = projectList.filter(p => p.live_url).length;
    const downCount = alertsList.length;
    const avgResponseTime = alertsList.length > 0
      ? alertsList.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / alertsList.length
      : 0;
    const last24hAlerts = alertsList.filter(a => {
      const checked = new Date(a.checked_at);
      return (Date.now() - checked.getTime()) < 24 * 60 * 60 * 1000;
    }).length;

    kpiContainer.innerHTML = `
      <div class="card kpi-card compact-kpi">
        <i class="fas fa-exclamation-triangle kpi-icon"></i>
        <h3>Down Projects</h3>
        <div class="value">${downCount}</div>
      </div>
      <div class="card kpi-card compact-kpi">
        <i class="fas fa-globe kpi-icon"></i>
        <h3>Total Monitored</h3>
        <div class="value">${totalMonitored}</div>
      </div>
      <div class="card kpi-card compact-kpi">
        <i class="fas fa-clock kpi-icon"></i>
        <h3>Avg Response Time</h3>
        <div class="value">${avgResponseTime.toFixed(0)} ms</div>
      </div>
      <div class="card kpi-card compact-kpi">
        <i class="fas fa-history kpi-icon"></i>
        <h3>Last 24h Alerts</h3>
        <div class="value">${last24hAlerts}</div>
      </div>
    `;
  }

  function applyFiltersAndSort() {
    let filtered = [...alerts];

    // Map project details (client)
    filtered = filtered.map(alert => {
      const project = projects.find(p => p.id == alert.id);
      return {
        ...alert,
        client: project?.client || '—',
      };
    });

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.name || '').toLowerCase().includes(term) ||
        (a.client || '').toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortField === 'client') {
        valA = (a.client || '').toLowerCase();
        valB = (b.client || '').toLowerCase();
      } else if (sortField === 'checked_at') {
        valA = new Date(a.checked_at || 0);
        valB = new Date(b.checked_at || 0);
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    renderAlertsTable(filtered);
    emptyState.classList.toggle('hidden', filtered.length > 0);
  }

  function renderAlertsTable(pageItems) {
    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No alerts found.</td></tr>`;
      return;
    }

    tbody.innerHTML = pageItems.map(a => `
      <tr data-id="${a.id}">
        <td><strong>${escapeHtml(a.name)}</strong></td>
        <td>${escapeHtml(a.client)}</td>
        <td><span class="status ${a.status ? a.status.toLowerCase() : 'down'}">${escapeHtml(a.status) || 'Down'}</span></td>
        <td>${a.checked_at ? new Date(a.checked_at).toLocaleString() : '—'}</td>
        <td class="actions-cell">
          <button class="btn btn-sm view-logs" data-id="${a.id}"><i class="fas fa-history"></i> Logs</button>
          <button class="btn btn-sm btn-outline resolve-alert" data-id="${a.id}"><i class="fas fa-check"></i> Resolve</button>
        </td>
      </tr>
    `).join('');
  }

  function renderDomainExpiryTable() {
    if (expiringDomains.length === 0) {
      domainTbody.innerHTML = `<tr><td colspan="5" class="empty-state">No domains expiring soon.</td></tr>`;
      domainEmpty.classList.add('hidden');
      return;
    }

    const now = new Date();
    domainTbody.innerHTML = expiringDomains.map(d => {
      const expiry = new Date(d.expiry_date);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return `
        <tr>
          <td><strong>${escapeHtml(d.name)}</strong></td>
          <td>${escapeHtml(d.domain_name) || '—'}</td>
          <td>${escapeHtml(d.registrar) || '—'}</td>
          <td>${new Date(d.expiry_date).toLocaleDateString()}</td>
          <td><span class="badge ${daysLeft <= 7 ? 'badge-overdue' : 'badge-due-soon'}">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</span></td>
        </tr>
      `;
    }).join('');
    domainEmpty.classList.add('hidden');
  }

  // Event: search
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    applyFiltersAndSort();
  });

  document.getElementById('clear-alerts-search-btn').addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    applyFiltersAndSort();
  });

  // Event: refresh button
  document.getElementById('refresh-alerts-btn').addEventListener('click', () => {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Loading uptime alerts…</td></tr>`;
    domainTbody.innerHTML = `<tr><td colspan="5" class="empty-state">Loading domain expiries…</td></tr>`;
    loadAlerts();
  });

  // Event: sortable columns
  document.querySelectorAll('#alerts-table .sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDir = 'asc';
      }
      applyFiltersAndSort();
      document.querySelectorAll('#alerts-table .sortable i').forEach(i => i.className = 'fas fa-sort');
      th.querySelector('i').className = sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    });
  });

  // Event: table actions (view logs / resolve)
  document.getElementById('alerts-table').addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = e.target.closest('tr');
    const projectId = row?.dataset.id;
    if (!projectId) return;

    if (btn.classList.contains('view-logs')) {
      await showUptimeLogsModal(projectId);
    } else if (btn.classList.contains('resolve-alert')) {
      await resolveAlert(projectId);
    }
  });

  async function showUptimeLogsModal(projectId) {
    let logs = [];
    try {
      logs = await uptimeService.getLogs(projectId);
    } catch (err) {
      console.error('Failed to load logs:', err);
      logs = [];
    }

    const project = projects.find(p => p.id == projectId);
    const content = `
      <div class="modal-header-bar">
        <h2><i class="fas fa-history"></i> Uptime Logs</h2>
        <span class="modal-count">${logs.length} recent checks</span>
      </div>
      <p style="margin-bottom:1rem;"><strong>Project:</strong> ${escapeHtml(project?.name || 'Unknown')}</p>
      <div class="summary-table-wrapper">
        <table class="summary-table">
          <thead>
            <tr><th>Checked At</th><th>Status</th><th>Response</th><th>HTTP Code</th></tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td>${new Date(log.checked_at).toLocaleString()}</td>
                <td>${log.is_up ? '<span class="badge badge-upcoming">Up</span>' : '<span class="badge badge-overdue">Down</span>'}</td>
                <td>${log.response_time_ms ? log.response_time_ms + ' ms' : '—'}</td>
                <td>${log.status_code || '—'}</td>
              </tr>
            `).join('')}
            ${logs.length === 0 ? '<tr><td colspan="4" class="empty-state">No logs found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    showModal(content);
  }

  async function resolveAlert(projectId) {
    try {
      await uptimeService.resolveAlert(projectId);
      showToast('Alert acknowledged', 'success');
      loadAlerts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Initial load
  loadAlerts();
}
