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
      <div id="showcase-grid" class="showcase-grid">
        <p class="empty-state">Loading projects…</p>
      </div>
    </div>
  `;

  initSidebar();

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  let allProjects = [];
  let exchangeRate = 129;

  async function loadExchangeRate() {
    try {
      const prefs = await dashboardService.getPreferences();
      exchangeRate = prefs.exchange_rate || 129;
    } catch (err) {
      console.warn('Could not load exchange rate', err);
    }
  }

  async function loadShowcase() {
    const grid = document.getElementById('showcase-grid');
    try {
      allProjects = await projectService.getAll();
      if (allProjects.length === 0) {
        grid.innerHTML = `<p class="empty-state"><i class="fas fa-folder-open fa-3x"></i><br>No projects found.</p>`;
        return;
      }
      grid.innerHTML = allProjects.map(p => renderShowcaseCard(p)).join('');
    } catch (err) {
      console.error('Failed to load showcase:', err);
      showToast('Failed to load projects.', 'error');
      grid.innerHTML = `<p class="empty-state">Error loading projects.</p>`;
    }
  }

  document.getElementById('refresh-showcase-btn').addEventListener('click', loadShowcase);

  // Card click → open detail modal using in‑memory data
  document.getElementById('showcase-grid').addEventListener('click', (e) => {
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

    // Load financial summary for this project
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

  // Safe parser that always returns an array
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
  loadShowcase();
}
