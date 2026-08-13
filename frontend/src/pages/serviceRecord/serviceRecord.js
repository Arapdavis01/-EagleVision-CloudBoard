import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { projectService } from '../../services/projectService.js';
import { api } from '../../services/api.js';
import { showModal } from '../../components/modal.js';
import { renderUpdateForm } from '../../components/updateForm.js';
import { showToast } from '../../utils/notifications.js';

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
        <button id="clear-update-filters-btn" class="btn btn-outline btn-sm">
          <i class="fas fa-times"></i> Clear
        </button>
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

  const projectSelect = document.getElementById('project-select');
  const addUpdateBtn = document.getElementById('add-update-btn');
  const updatesContainer = document.getElementById('updates-container');
  const searchInput = document.getElementById('update-search');
  const typeFilterSelect = document.getElementById('type-filter');
  const clearBtn = document.getElementById('clear-update-filters-btn');

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
      renderUpdates();
    } catch (err) {
      console.error('Failed to load updates:', err);
      showToast('Failed to load service records.', 'error');
      allUpdates = [];
      renderUpdates();
    }
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

    if (filtered.length === 0) {
      updatesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list fa-3x"></i>
          <p>No service records found for this project.</p>
        </div>`;
      return;
    }

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
            ${filtered.map(u => `
              <tr data-id="${u.id}">
                <td><span class="update-type-badge">${escapeHtml(u.update_type)}</span></td>
                <td><strong>${escapeHtml(u.title)}</strong></td>
                <td>${escapeHtml(u.description || '—')}</td>
                <td>${u.cost ? '$' + parseFloat(u.cost).toLocaleString() : '—'}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                  <button class="btn btn-sm edit-update" data-id="${u.id}"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-sm btn-danger delete-update" data-id="${u.id}"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Event: project select change
  projectSelect.addEventListener('change', async () => {
    selectedProjectId = projectSelect.value;
    addUpdateBtn.disabled = !selectedProjectId;
    searchTerm = '';
    typeFilter = 'all';
    searchInput.value = '';
    typeFilterSelect.value = 'all';
    if (selectedProjectId) {
      await loadUpdates(selectedProjectId);
    } else {
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

  // Event: clear filters
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    typeFilterSelect.value = 'all';
    searchTerm = '';
    typeFilter = 'all';
    renderUpdates();
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
    const row = e.target.closest('tr');
    const updateId = row?.dataset.id;
    if (!updateId) return;

    if (btn.classList.contains('delete-update')) {
      if (!confirm('Delete this service record?')) return;
      try {
        await api(`/api/updates/${updateId}`, { method: 'DELETE' });
        showToast('Service record deleted', 'info');
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
