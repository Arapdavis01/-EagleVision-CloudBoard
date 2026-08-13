import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { projectService } from '../../services/projectService.js';
import { api } from '../../services/api.js';
import { showModal } from '../../components/modal.js';
import { renderUpdateForm } from '../../components/updateForm.js';
import { showToast } from '../../utils/notifications.js';
import { confirmDialog } from '../../utils/confirm.js';

export async function serviceRecordPage() {
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="service-record-header">
        <h2>Service Record</h2>
        <button id="add-update-btn" class="btn btn-primary" disabled>
          <i class="fas fa-plus"></i> Add Update
        </button>
      </div>

      <div class="service-record-toolbar">
        <select id="project-select" class="sort-select">
          <option value="">-- Select Project --</option>
        </select>
        <input type="text" id="update-search" placeholder="Search by title or description...">
        <select id="type-filter" class="sort-select">
          <option value="all">All Types</option>
          <option value="Feature">Feature</option>
          <option value="Bug Fix">Bug Fix</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Upgrade">Upgrade</option>
          <option value="Other">Other</option>
        </select>
        <input type="date" id="date-from" title="From date">
        <input type="date" id="date-to" title="To date">
        <button id="clear-update-filters-btn" class="btn btn-outline btn-sm">
          <i class="fas fa-times"></i> Clear
        </button>
      </div>

      <!-- Project Summary Header (hidden until project selected) -->
      <div id="project-summary" class="card compact-card hidden">
        <div class="project-summary-header">
          <h3 id="summary-project-name"></h3>
          <span id="summary-client" class="badge badge-upcoming"></span>
          <span id="summary-status" class="status"></span>
        </div>
      </div>

      <!-- Summary KPI Cards (hidden until project selected) -->
      <div id="summary-kpi-container" class="kpi-grid hidden">
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-clipboard-list kpi-icon"></i>
          <h3>Total Updates</h3>
          <div class="value" id="kpi-total-updates">0</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-calendar-check kpi-icon"></i>
          <h3>Last Updated</h3>
          <div class="value" id="kpi-last-update" style="font-size:1rem;">—</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-dollar-sign kpi-icon"></i>
          <h3>Total Cost</h3>
          <div class="value" id="kpi-total-cost">$0</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-calculator kpi-icon"></i>
          <h3>Avg Cost</h3>
          <div class="value" id="kpi-avg-cost">$0</div>
        </div>
      </div>

      <!-- View Toggle (Timeline/Table) -->
      <div class="view-toggle" style="margin-bottom:0.5rem;">
        <button id="view-table-btn" class="btn btn-sm active"><i class="fas fa-table"></i> Table</button>
        <button id="view-timeline-btn" class="btn btn-sm"><i class="fas fa-stream"></i> Timeline</button>
        <button id="print-record-btn" class="btn btn-sm btn-outline" style="margin-left:auto;"><i class="fas fa-print"></i> Print</button>
      </div>

      <div id="updates-container">
        <div class="empty-state">
          <i class="fas fa-history fa-3x"></i>
          <p>Select a project to see its service record.</p>
        </div>
      </div>
    </div>
  `;

  initSidebar();

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  // State
  let allProjects = [];
  let selectedProjectId = '';
  let allUpdates = [];
  let searchTerm = '';
  let typeFilter = 'all';
  let dateFrom = '';
  let dateTo = '';
  let currentView = 'table';  // 'table' or 'timeline'

  const projectSelect = document.getElementById('project-select');
  const addUpdateBtn = document.getElementById('add-update-btn');
  const updatesContainer = document.getElementById('updates-container');
  const searchInput = document.getElementById('update-search');
  const typeFilterSelect = document.getElementById('type-filter');
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const clearBtn = document.getElementById('clear-update-filters-btn');
  const viewTableBtn = document.getElementById('view-table-btn');
  const viewTimelineBtn = document.getElementById('view-timeline-btn');
  const printBtn = document.getElementById('print-record-btn');
  const projectSummary = document.getElementById('project-summary');
  const summaryKpiContainer = document.getElementById('summary-kpi-container');

  // Load all projects for dropdown
  async function loadProjects() {
    try {
      allProjects = await projectService.getAll();
      projectSelect.innerHTML = `
        <option value="">-- Select Project --</option>
        ${allProjects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
      `;

      // Pre-select from URL query
      const params = new URLSearchParams(location.hash.split('?')[1] || '');
      const preselected = params.get('project_id');
      if (preselected) {
        projectSelect.value = preselected;
        selectedProjectId = preselected;
        addUpdateBtn.disabled = false;
        await loadUpdates(preselected);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      showToast('Failed to load projects.', 'error');
    }
  }

  async function loadUpdates(projectId) {
    if (!projectId) return;
    try {
      allUpdates = await api(`/api/projects/${projectId}/updates`);
      updateProjectSummaryAndKPIs();
      renderUpdates();
    } catch (err) {
      console.error('Failed to load updates:', err);
      showToast('Failed to load service records.', 'error');
      allUpdates = [];
      updateProjectSummaryAndKPIs();
      renderUpdates();
    }
  }

  function updateProjectSummaryAndKPIs() {
    // Show summary if project selected
    if (selectedProjectId) {
      projectSummary.classList.remove('hidden');
      summaryKpiContainer.classList.remove('hidden');

      const project = allProjects.find(p => p.id == selectedProjectId);
      if (project) {
        document.getElementById('summary-project-name').textContent = project.name;
        document.getElementById('summary-client').textContent = project.client || 'No client';
        const statusSpan = document.getElementById('summary-status');
        statusSpan.textContent = project.status || '—';
        statusSpan.className = `status ${(project.status || '').toLowerCase()}`;
      }

      const totalUpdates = allUpdates.length;
      const totalCost = allUpdates.reduce((sum, u) => sum + parseFloat(u.cost || 0), 0);
      const avgCost = totalUpdates > 0 ? totalCost / totalUpdates : 0;
      const lastUpdateDate = totalUpdates > 0 ? new Date(allUpdates[0].created_at).toLocaleDateString() : '—';

      document.getElementById('kpi-total-updates').textContent = totalUpdates;
      document.getElementById('kpi-last-update').textContent = lastUpdateDate;
      document.getElementById('kpi-total-cost').textContent = `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('kpi-avg-cost').textContent = `$${avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      projectSummary.classList.add('hidden');
      summaryKpiContainer.classList.add('hidden');
    }
  }

  function getFilteredUpdates() {
    let filtered = [...allUpdates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.title || '').toLowerCase().includes(term) ||
        (u.description || '').toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(u => u.update_type === typeFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter(u => new Date(u.created_at).toISOString().slice(0,10) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(u => new Date(u.created_at).toISOString().slice(0,10) <= dateTo);
    }

    return filtered;
  }

  function renderUpdates() {
    if (!selectedProjectId) {
      updatesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history fa-3x"></i>
          <p>Select a project to see its service record.</p>
        </div>`;
      return;
    }

    const filtered = getFilteredUpdates();

    if (filtered.length === 0) {
      updatesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list fa-3x"></i>
          <p>No service records found for this project.</p>
        </div>`;
      return;
    }

    if (currentView === 'timeline') {
      renderTimeline(filtered);
    } else {
      renderTable(filtered);
    }
  }

  function renderTable(items) {
    updatesContainer.innerHTML = `
      <div class="table-container card">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(u => {
              const { icon, colorClass } = getUpdateTypeVisual(u.update_type);
              return `
                <tr data-id="${u.id}">
                  <td><span class="update-type-badge ${colorClass}"><i class="fas ${icon}"></i> ${escapeHtml(u.update_type)}</span></td>
                  <td><strong>${escapeHtml(u.title)}</strong></td>
                  <td>${escapeHtml(u.description || '—')}</td>
                  <td>${u.cost ? '$' + parseFloat(u.cost).toLocaleString() : '—'}</td>
                  <td>${new Date(u.created_at).toLocaleDateString()}</td>
                  <td class="actions-cell">
                    <button class="btn btn-sm edit-update" data-id="${u.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-update" data-id="${u.id}"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTimeline(items) {
    updatesContainer.innerHTML = `
      <div class="timeline-container">
        ${items.map(u => {
          const { icon, colorClass } = getUpdateTypeVisual(u.update_type);
          return `
            <div class="timeline-item">
              <div class="timeline-icon ${colorClass}">
                <i class="fas ${icon}"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <strong>${escapeHtml(u.title)}</strong>
                  <span class="update-type-badge ${colorClass}"><i class="fas ${icon}"></i> ${escapeHtml(u.update_type)}</span>
                </div>
                <p>${escapeHtml(u.description || 'No description')}</p>
                <div class="timeline-meta">
                  <span><i class="fas fa-calendar-alt"></i> ${new Date(u.created_at).toLocaleString()}</span>
                  ${u.cost ? `<span><i class="fas fa-dollar-sign"></i> $${parseFloat(u.cost).toLocaleString()}</span>` : ''}
                  <div class="actions-cell">
                    <button class="btn btn-sm edit-update" data-id="${u.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-update" data-id="${u.id}"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function getUpdateTypeVisual(type) {
    switch (type) {
      case 'Feature': return { icon: 'fa-plus', colorClass: 'type-feature' };
      case 'Bug Fix': return { icon: 'fa-bug', colorClass: 'type-bugfix' };
      case 'Maintenance': return { icon: 'fa-wrench', colorClass: 'type-maintenance' };
      case 'Upgrade': return { icon: 'fa-arrow-up', colorClass: 'type-upgrade' };
      default: return { icon: 'fa-circle', colorClass: 'type-other' };
    }
  }

  // Event: project select change
  projectSelect.addEventListener('change', async () => {
    selectedProjectId = projectSelect.value;
    addUpdateBtn.disabled = !selectedProjectId;
    searchTerm = '';
    typeFilter = 'all';
    dateFrom = '';
    dateTo = '';
    searchInput.value = '';
    typeFilterSelect.value = 'all';
    dateFromInput.value = '';
    dateToInput.value = '';
    if (selectedProjectId) {
      await loadUpdates(selectedProjectId);
    } else {
      updateProjectSummaryAndKPIs();
      renderUpdates();
    }
  });

  // Event: search input
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderUpdates();
  });

  // Event: type filter
  typeFilterSelect.addEventListener('change', e => {
    typeFilter = e.target.value;
    renderUpdates();
  });

  // Event: date filters
  dateFromInput.addEventListener('change', e => {
    dateFrom = e.target.value;
    renderUpdates();
  });
  dateToInput.addEventListener('change', e => {
    dateTo = e.target.value;
    renderUpdates();
  });

  // Event: clear filters
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    typeFilterSelect.value = 'all';
    dateFromInput.value = '';
    dateToInput.value = '';
    searchTerm = '';
    typeFilter = 'all';
    dateFrom = '';
    dateTo = '';
    renderUpdates();
  });

  // View toggle events
  viewTableBtn.addEventListener('click', () => {
    currentView = 'table';
    viewTableBtn.classList.add('active');
    viewTimelineBtn.classList.remove('active');
    renderUpdates();
  });

  viewTimelineBtn.addEventListener('click', () => {
    currentView = 'timeline';
    viewTimelineBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderUpdates();
  });

  // Print record
  printBtn.addEventListener('click', () => {
    if (!selectedProjectId) return showToast('Select a project first.', 'error');
    const filtered = getFilteredUpdates();
    const project = allProjects.find(p => p.id == selectedProjectId);
    const printContent = `
      <html>
        <head><title>Service Record</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Service Record</h1>
          <p><strong>Project:</strong> ${escapeHtml(project?.name || '')}</p>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr><th>Type</th><th>Title</th><th>Description</th><th>Cost</th><th>Date</th></tr>
            ${filtered.map(u => `
              <tr>
                <td>${escapeHtml(u.update_type)}</td>
                <td>${escapeHtml(u.title)}</td>
                <td>${escapeHtml(u.description || '')}</td>
                <td>${u.cost ? '$' + parseFloat(u.cost).toLocaleString() : '—'}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </table>
          <p><em>Generated by EagleVision CloudBoard</em></p>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.print();
  });

  // Event: Add Update button
  addUpdateBtn.addEventListener('click', () => {
    if (!selectedProjectId) return;
    const { close } = showModal(renderUpdateForm(selectedProjectId));
    const form = document.getElementById('update-form');

    document.querySelector('.cancel-update-btn')?.addEventListener('click', () => close());

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await api(`/api/projects/${selectedProjectId}/updates`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        close();
        showToast('Service record added', 'success');
        loadUpdates(selectedProjectId);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Event delegation for edit/delete update actions
  updatesContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = e.target.closest('.timeline-item, tr');
    const updateId = row?.dataset.id || (row ? row.dataset.id : null);
    if (!updateId) return;

    if (btn.classList.contains('delete-update')) {
      const confirmed = await confirmDialog('Delete this service record?', 'Confirm Deletion');
      if (!confirmed) return;
      try {
        await api(`/api/updates/${updateId}`, { method: 'DELETE' });
        showToast('Service record deleted', 'success');
        loadUpdates(selectedProjectId);
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else if (btn.classList.contains('edit-update')) {
      const update = allUpdates.find(u => u.id == updateId);
      if (!update) return;

      const { close } = showModal(renderUpdateForm(selectedProjectId, update));
      const form = document.getElementById('update-form');

      document.querySelector('.cancel-update-btn')?.addEventListener('click', () => close());

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        try {
          await api(`/api/updates/${updateId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          close();
          showToast('Service record updated', 'success');
          loadUpdates(selectedProjectId);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });

  // Initial load
  loadProjects();
}
