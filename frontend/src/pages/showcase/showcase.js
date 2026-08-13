import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { projectService } from '../../services/projectService.js';
import { financeService } from '../../services/financeService.js';
import { dashboardService } from '../../services/dashboardService.js';
import { renderShowcaseCard } from '../../components/showcaseCard.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../utils/notifications.js';

export async function showcasePage() {
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="showcase-header">
        <h2>Project Showcase</h2>
        <button id="refresh-showcase-btn" class="btn btn-outline"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>

      <!-- KPI Stats Header -->
      <div id="showcase-stats" class="kpi-grid compact-stats">
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-folder-open kpi-icon"></i>
          <h3>Total Projects</h3>
          <div class="value" id="stat-total">0</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-rocket kpi-icon"></i>
          <h3>Live</h3>
          <div class="value" id="stat-live">0</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-code kpi-icon"></i>
          <h3>Development</h3>
          <div class="value" id="stat-development">0</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-wrench kpi-icon"></i>
          <h3>Maintenance</h3>
          <div class="value" id="stat-maintenance">0</div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="showcase-toolbar">
        <input type="text" id="showcase-search" placeholder="Search by name or client...">
        <select id="showcase-status-filter" class="sort-select">
          <option value="all">All Status</option>
          <option value="Planning">Planning</option>
          <option value="Development">Development</option>
          <option value="Live">Live</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Archived">Archived</option>
        </select>
        <select id="showcase-type-filter" class="sort-select">
          <option value="all">All Types</option>
          <option value="Website">Website</option>
          <option value="Web Application">Web Application</option>
          <option value="Mobile App">Mobile App</option>
          <option value="Desktop App">Desktop App</option>
          <option value="API / Backend">API / Backend</option>
          <option value="Other">Other</option>
        </select>
        <select id="showcase-sort" class="sort-select">
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="client-asc">Client A–Z</option>
          <option value="updated-desc">Last Updated (newest)</option>
          <option value="updated-asc">Last Updated (oldest)</option>
        </select>
        <button id="clear-showcase-filters-btn" class="btn btn-outline btn-sm">
          <i class="fas fa-times"></i> Clear
        </button>
      </div>

      <!-- Grid -->
      <div id="showcase-grid" class="showcase-grid">
        <p class="empty-state">Loading projects…</p>
      </div>

      <!-- Load More -->
      <div id="load-more-container" class="load-more-wrapper hidden">
        <button id="load-more-btn" class="btn btn-outline">Load More</button>
      </div>
    </div>
  `;

  initSidebar();

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  // State
  let allProjects = [];
  let exchangeRate = 129;
  let currentPage = 1;
  const pageSize = 8;
  let filteredProjects = [];

  // UI elements
  const searchInput = document.getElementById('showcase-search');
  const statusFilter = document.getElementById('showcase-status-filter');
  const typeFilter = document.getElementById('showcase-type-filter');
  const sortSelect = document.getElementById('showcase-sort');
  const clearBtn = document.getElementById('clear-showcase-filters-btn');
  const grid = document.getElementById('showcase-grid');
  const loadMoreContainer = document.getElementById('load-more-container');
  const loadMoreBtn = document.getElementById('load-more-btn');

  async function loadExchangeRate() {
    try {
      const prefs = await dashboardService.getPreferences();
      exchangeRate = prefs.exchange_rate || 129;
    } catch (err) {
      console.warn('Could not load exchange rate', err);
    }
  }

  async function loadShowcase() {
    try {
      allProjects = await projectService.getAll();
      updateStats(allProjects);
      applyFiltersAndSort();
    } catch (err) {
      console.error('Failed to load showcase:', err);
      showToast('Failed to load projects.', 'error');
      grid.innerHTML = `<p class="empty-state">Error loading projects.</p>`;
    }
  }

  function updateStats(projects) {
    document.getElementById('stat-total').textContent = projects.length;
    document.getElementById('stat-live').textContent = projects.filter(p => p.status === 'Live').length;
    document.getElementById('stat-development').textContent = projects.filter(p => p.status === 'Development').length;
    document.getElementById('stat-maintenance').textContent = projects.filter(p => p.status === 'Maintenance').length;
  }

  function applyFiltersAndSort() {
    const term = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const type = typeFilter.value;
    const sort = sortSelect.value;

    filteredProjects = allProjects.filter(p => {
      const matchesSearch =
        !term ||
        (p.name || '').toLowerCase().includes(term) ||
        (p.client || '').toLowerCase().includes(term);
      const matchesStatus = status === 'all' || p.status === status;
      const matchesType = type === 'all' || p.project_type === type;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    filteredProjects.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const clientA = (a.client || '').toLowerCase();
      const clientB = (b.client || '').toLowerCase();
      const updatedA = new Date(a.last_updated || 0);
      const updatedB = new Date(b.last_updated || 0);

      switch (sort) {
        case 'name-asc': return nameA.localeCompare(nameB);
        case 'name-desc': return nameB.localeCompare(nameA);
        case 'client-asc': return clientA.localeCompare(clientB);
        case 'client-desc': return clientB.localeCompare(clientA);
        case 'updated-desc': return updatedB - updatedA;
        case 'updated-asc': return updatedA - updatedB;
        default: return 0;
      }
    });

    currentPage = 1;
    renderGrid();
  }

  function renderGrid() {
    const start = 0;
    const end = currentPage * pageSize;
    const pageItems = filteredProjects.slice(start, end);

    if (pageItems.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open fa-3x"></i>
          <p>No projects found.</p>
        </div>`;
      loadMoreContainer.classList.add('hidden');
      return;
    }

    grid.innerHTML = pageItems.map(p => renderShowcaseCard(p)).join('');

    // Show/hide Load More button
    if (end < filteredProjects.length) {
      loadMoreContainer.classList.remove('hidden');
    } else {
      loadMoreContainer.classList.add('hidden');
    }
  }

  // Event listeners for filters
  searchInput.addEventListener('input', applyFiltersAndSort);
  statusFilter.addEventListener('change', applyFiltersAndSort);
  typeFilter.addEventListener('change', applyFiltersAndSort);
  sortSelect.addEventListener('change', applyFiltersAndSort);

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    statusFilter.value = 'all';
    typeFilter.value = 'all';
    sortSelect.value = 'name-asc';
    applyFiltersAndSort();
  });

  document.getElementById('refresh-showcase-btn').addEventListener('click', async () => {
    grid.innerHTML = '<p class="empty-state">Loading projects…</p>';
    await loadShowcase();
  });

  // Load More
  loadMoreBtn.addEventListener('click', () => {
    currentPage += 1;
    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    const pageItems = filteredProjects.slice(start, end);

    if (pageItems.length > 0) {
      grid.insertAdjacentHTML('beforeend', pageItems.map(p => renderShowcaseCard(p)).join(''));
    }

    if (end >= filteredProjects.length) {
      loadMoreContainer.classList.add('hidden');
    }
  });

  // Card click → open detail modal using in‑memory data
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.showcase-card');
    if (!card) return;
    const projectId = card.dataset.id;
    openProjectDetails(projectId);
  });

  async function openProjectDetails(projectId) {
    const project = allProjects.find(p => p.id == projectId);
    if (!project) {
      showToast('Project not found.', 'error');
      return;
    }

    let projectExpenses = [];
    let allRevenue = [];
    try {
      [projectExpenses, allRevenue] = await Promise.all([
        financeService.getExpensesByProject(projectId),
        financeService.getRevenue()
      ]);
    } catch (err) {
      console.warn('Could not load financial data:', err);
      projectExpenses = [];
      allRevenue = [];
    }

    const totalExpenses = projectExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const projectRevenue = allRevenue
      .filter(s => s.project_id == projectId)
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const netProfit = projectRevenue - totalExpenses;
    const askingPrice = project.asking_price ? parseFloat(project.asking_price) : 0;

    const techStack = parseTechStack(project.tech_stack).join(', ') || '—';

    const content = `
      <div class="modal-header-bar">
        <h2><i class="fas fa-info-circle"></i> ${escapeHtml(project.name)}</h2>
        <span class="status ${(project.status || '').toLowerCase()}">${escapeHtml(project.status) || '—'}</span>
      </div>
      ${project.thumbnail_url
        ? `<img src="${escapeHtml(project.thumbnail_url)}" alt="${escapeHtml(project.name)}" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" />`
        : `<div class="showcase-placeholder" style="height:200px;margin-bottom:1rem;"><i class="fas fa-image"></i></div>`
      }
      <div class="quick-view-grid">
        <div><strong>Client:</strong> ${escapeHtml(project.client) || '—'}</div>
        <div><strong>Location:</strong> ${escapeHtml(project.location) || '—'}</div>
        <div><strong>Live URL:</strong> <a href="${escapeHtml(project.live_url)}" target="_blank">${escapeHtml(project.live_url) || '—'}</a></div>
        <div><strong>GitHub:</strong> <a href="${escapeHtml(project.github)}" target="_blank">${escapeHtml(project.github) || '—'}</a></div>
        <div><strong>Hosting:</strong> ${escapeHtml(project.hosting) || '—'}</div>
        <div><strong>Tech Stack:</strong> ${escapeHtml(techStack)}</div>
        <div><strong>Project Type:</strong> ${escapeHtml(project.project_type) || '—'}</div>
        <div><strong>Last Updated:</strong> ${project.last_updated ? new Date(project.last_updated).toLocaleString() : '—'}</div>
      </div>

      <hr class="form-divider">
      <h3><i class="fas fa-calculator"></i> Cost Summary</h3>
      <div class="cost-summary-grid">
        <div><strong>Total Expenses:</strong> $${totalExpenses.toLocaleString()} (KSh ${(totalExpenses * exchangeRate).toLocaleString()})</div>
        <div><strong>Total Revenue:</strong> $${projectRevenue.toLocaleString()} (KSh ${(projectRevenue * exchangeRate).toLocaleString()})</div>
        <div><strong>Net Profit:</strong> $${netProfit.toLocaleString()} (KSh ${(netProfit * exchangeRate).toLocaleString()})</div>
        <div><strong>Asking Price:</strong> $${askingPrice.toLocaleString()} (KSh ${(askingPrice * exchangeRate).toLocaleString()})</div>
      </div>

      <div class="form-group">
        <strong>Description:</strong>
        <p>${escapeHtml(project.description) || 'No description.'}</p>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline print-cost-summary-btn"><i class="fas fa-print"></i> Print Statement</button>
        <button id="close-showcase-modal-btn" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back</button>
      </div>
    `;

    const { close } = showModal(content);

    document.getElementById('close-showcase-modal-btn')?.addEventListener('click', close);

    document.querySelector('.print-cost-summary-btn')?.addEventListener('click', () => {
      const printContent = `
        <html>
          <head><title>Project Cost Summary</title></head>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>${escapeHtml(project.name)}</h1>
            <p><strong>Client:</strong> ${escapeHtml(project.client) || '—'}</p>
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
              <tr><th>Metric</th><th>USD</th><th>KES (${exchangeRate})</th></tr>
              <tr><td>Total Expenses</td><td>$${totalExpenses.toLocaleString()}</td><td>KSh ${(totalExpenses * exchangeRate).toLocaleString()}</td></tr>
              <tr><td>Total Revenue</td><td>$${projectRevenue.toLocaleString()}</td><td>KSh ${(projectRevenue * exchangeRate).toLocaleString()}</td></tr>
              <tr><td>Net Profit</td><td>$${netProfit.toLocaleString()}</td><td>KSh ${(netProfit * exchangeRate).toLocaleString()}</td></tr>
              <tr><td>Asking Price</td><td>$${askingPrice.toLocaleString()}</td><td>KSh ${(askingPrice * exchangeRate).toLocaleString()}</td></tr>
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
  }

  function parseTechStack(tech) {
    if (!tech) return [];
    if (Array.isArray(tech)) return tech;
    if (typeof tech === 'string') {
      try {
        const parsed = JSON.parse(tech);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') return parsed.split(',').map(s => s.trim()).filter(Boolean);
        return [];
      } catch {
        return tech.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  // Initial load
  await loadExchangeRate();
  await loadShowcase();
}
