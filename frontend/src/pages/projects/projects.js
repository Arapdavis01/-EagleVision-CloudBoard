import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { projectService } from '../../services/projectService.js';
import { uploadImage } from '../../services/uploadService.js';
import { renderProjectCard } from '../../components/projectCard.js';
import { showModal } from '../../components/modal.js';
import { renderProjectForm } from '../../components/projectForm.js';
import { showToast } from '../../utils/notifications.js';

export async function projectsPage() {
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="projects-header">
        <h2>Projects</h2>
        <button id="add-project-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Project</button>
      </div>

      <!-- Filter bar: status pills -->
      <div class="filter-bar">
        <button class="filter-pill active" data-status="all">All</button>
        <button class="filter-pill" data-status="Planning">Planning</button>
        <button class="filter-pill" data-status="Development">Development</button>
        <button class="filter-pill" data-status="Live">Live</button>
        <button class="filter-pill" data-status="Maintenance">Maintenance</button>
        <button class="filter-pill" data-status="Archived">Archived</button>
      </div>

      <!-- Toolbar: search, sort, view toggle -->
      <div class="toolbar">
        <input type="text" id="search" placeholder="Search by name, client, or tags...">
        <select id="sort-select" class="sort-select">
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="client-asc">Client A–Z</option>
          <option value="client-desc">Client Z–A</option>
          <option value="updated-desc">Last Updated (newest)</option>
          <option value="updated-asc">Last Updated (oldest)</option>
        </select>
        <div class="view-toggle">
          <button class="btn view-grid active" data-view="grid"><i class="fas fa-th-large"></i> Grid</button>
          <button class="btn view-list" data-view="list"><i class="fas fa-list"></i> List</button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div id="loading-skeleton" class="projects-grid">
        ${renderSkeletonCards(6)}
      </div>

      <!-- Projects container -->
      <div id="projects-container" class="projects-grid hidden"></div>

      <!-- Empty state -->
      <div id="empty-state" class="empty-state hidden">
        <i class="fas fa-folder-open fa-3x"></i>
        <p>No projects found.</p>
      </div>
    </div>
  `;

  initSidebar();

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  const parseTechStack = (tech) => {
    if (!tech) return [];
    if (Array.isArray(tech)) return tech;
    if (typeof tech === 'string') {
      try { return JSON.parse(tech); } catch (e) { return []; }
    }
    return [];
  };

  // State
  let currentView = 'grid';
  let projects = [];
  let currentStatus = 'all';
  let currentSort = 'name-asc';
  let searchTerm = '';

  // URL filter
  const hash = location.hash.split('?')[1] || '';
  const params = new URLSearchParams(hash);
  const urlFilter = params.get('filter');
  if (urlFilter === 'live') currentStatus = 'Live';
  else if (urlFilter === 'clients') currentStatus = 'all';
  else if (urlFilter === 'revenue') { location.hash = '#finance'; return; }

  // DOM elements
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort-select');
  const container = document.getElementById('projects-container');
  const skeleton = document.getElementById('loading-skeleton');
  const emptyState = document.getElementById('empty-state');
  const viewGridBtn = document.querySelector('.view-grid');
  const viewListBtn = document.querySelector('.view-list');
  const filterPills = document.querySelectorAll('.filter-pill');

  function renderSkeletonCards(count) {
    return Array(count).fill().map(() => `
      <div class="card skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-badge"></div>
      </div>
    `).join('');
  }

  async function loadProjects(search = '') {
    skeleton.classList.remove('hidden');
    container.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
      projects = await projectService.getAll(search);
    } catch (err) {
      console.error('Failed to load projects:', err);
      showToast('Failed to load projects. Check connection.', 'error');
      projects = [];
    }

    if (currentStatus !== 'all') {
      projects = projects.filter(p => p.status === currentStatus);
    }

    sortProjects();

    if (projects.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }

    renderProjects();
    skeleton.classList.add('hidden');
    container.classList.remove('hidden');
  }

  function sortProjects() {
    projects.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const clientA = (a.client || '').toLowerCase();
      const clientB = (b.client || '').toLowerCase();
      const updatedA = new Date(a.last_updated || 0);
      const updatedB = new Date(b.last_updated || 0);

      switch (currentSort) {
        case 'name-asc': return nameA.localeCompare(nameB);
        case 'name-desc': return nameB.localeCompare(nameA);
        case 'client-asc': return clientA.localeCompare(clientB);
        case 'client-desc': return clientB.localeCompare(clientA);
        case 'updated-desc': return updatedB - updatedA;
        case 'updated-asc': return updatedA - updatedB;
        default: return 0;
      }
    });
  }

  function renderProjects() {
    container.className = currentView === 'grid' ? 'projects-grid' : 'projects-list';
    container.innerHTML = projects.map(p => renderProjectCard(p, currentView)).join('');
  }

  // Event delegation for project actions
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const projectId = btn.dataset.id;
    if (!projectId) return;

    if (btn.classList.contains('edit-project')) {
      handleEdit(projectId);
    } else if (btn.classList.contains('delete-project')) {
      handleDelete(projectId);
    } else if (btn.classList.contains('copy-link')) {
      handleCopyLink(btn.dataset.token);
    } else if (btn.classList.contains('quick-view-project')) {
      handleQuickView(projectId);
    }
  });

  function handleQuickView(projectId) {
    const project = projects.find(p => p.id == projectId);
    if (!project) return showToast('Project not found', 'error');

    const techList = parseTechStack(project.tech_stack);
    const techStack = techList.length ? techList.join(', ') : '—';
    const tags = project.tags ? project.tags : '—';
    const content = `
      <div class="modal-header-bar">
        <h2><i class="fas fa-info-circle"></i> ${escapeHtml(project.name)}</h2>
        <span class="status ${(project.status || '').toLowerCase()}">${project.status || '—'}</span>
      </div>
      <div class="quick-view-grid">
        <div><strong>Client:</strong> ${escapeHtml(project.client) || '—'}</div>
        <div><strong>Location:</strong> ${escapeHtml(project.location) || '—'}</div>
        <div><strong>Live URL:</strong> <a href="${escapeHtml(project.live_url)}" target="_blank">${escapeHtml(project.live_url) || '—'}</a></div>
        <div><strong>GitHub:</strong> <a href="${escapeHtml(project.github)}" target="_blank">${escapeHtml(project.github) || '—'}</a></div>
        <div><strong>Hosting:</strong> ${escapeHtml(project.hosting) || '—'}</div>
        <div><strong>Tech Stack:</strong> ${techStack}</div>
        <div><strong>Tags:</strong> ${tags}</div>
        <div><strong>Last Updated:</strong> ${project.last_updated ? new Date(project.last_updated).toLocaleString() : '—'}</div>
        <div><strong>Next Review:</strong> ${project.next_review_date ? new Date(project.next_review_date).toLocaleDateString() : '—'}</div>
      </div>
      <div class="form-group">
        <strong>Description:</strong>
        <p>${escapeHtml(project.description) || 'No description.'}</p>
      </div>
    `;
    showModal(content);
  }

  async function handleEdit(projectId) {
    const project = projects.find(p => p.id == projectId);
    if (!project) return showToast('Project not found', 'error');

    const { close } = showModal(renderProjectForm(project));
    const form = document.getElementById('project-form');
    if (!form) return;

    const cancelBtn = document.querySelector('.cancel-form-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => close());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1) Handle image upload if a file was selected
      const fileInput = document.getElementById('project-thumbnail-file');
      const thumbnailUrlInput = document.getElementById('project-thumbnail');
      if (fileInput && fileInput.files.length > 0) {
        try {
          showToast('Uploading image...', 'info');
          const { url } = await uploadImage(fileInput.files[0]);
          thumbnailUrlInput.value = url;
        } catch (err) {
          showToast(err.message, 'error');
          return;
        }
      }

      // 2) Collect form data and update project
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.update(projectId, data);
        close();
        await loadProjects();
        showToast('Project updated', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  async function handleDelete(projectId) {
    if (!confirm('Delete this project?')) return;
    try {
      await projectService.delete(projectId);
      await loadProjects();
      showToast('Project deleted', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleCopyLink(token) {
    if (!token) {
      showToast('No public link available', 'error');
      return;
    }
    const link = `${window.location.origin}/#public-status?token=${token}`;
    navigator.clipboard.writeText(link)
      .then(() => showToast('Public link copied!', 'success'))
      .catch(() => showToast('Failed to copy', 'error'));
  }

  // Add Project button
  document.getElementById('add-project-btn').addEventListener('click', () => {
    const { close } = showModal(renderProjectForm());
    const form = document.getElementById('project-form');
    if (!form) return;

    const cancelBtn = document.querySelector('.cancel-form-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => close());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1) Handle image upload if a file was selected
      const fileInput = document.getElementById('project-thumbnail-file');
      const thumbnailUrlInput = document.getElementById('project-thumbnail');
      if (fileInput && fileInput.files.length > 0) {
        try {
          showToast('Uploading image...', 'info');
          const { url } = await uploadImage(fileInput.files[0]);
          thumbnailUrlInput.value = url;
        } catch (err) {
          showToast(err.message, 'error');
          return;
        }
      }

      // 2) Collect form data and create project
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.create(data);
        close();
        await loadProjects();
        showToast('Project created', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  searchInput.addEventListener('input', (e) => loadProjects(e.target.value));

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    sortProjects();
    renderProjects();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentStatus = pill.dataset.status;
      loadProjects(searchInput.value);
    });
  });

  viewGridBtn.addEventListener('click', () => {
    currentView = 'grid';
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    renderProjects();
  });

  viewListBtn.addEventListener('click', () => {
    currentView = 'list';
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    renderProjects();
  });

  loadProjects();
}
