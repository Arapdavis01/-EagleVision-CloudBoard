import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { dashboardService } from '../../services/dashboardService.js';
import { projectService } from '../../services/projectService.js';
import { salesService } from '../../services/salesService.js';
import { renderKPIs } from '../../components/kpiCards.js';
import { renderUpcomingReviews } from '../../components/upcomingReviews.js';
import { showModal } from '../../components/modal.js';
import { renderProjectForm } from '../../components/projectForm.js';
import { renderSaleForm } from '../../components/saleForm.js';
import { showToast } from '../../utils/notifications.js';

export async function dashboardPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        <div class="quick-actions">
          <button id="add-project-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Project</button>
          <button id="record-sale-btn" class="btn btn-outline"><i class="fas fa-receipt"></i> Record Sale</button>
        </div>
      </div>
      <div id="kpi-container"></div>
      <div id="reviews-container"></div>
      <div id="recent-projects-container" class="card">
        <div class="card-header">
          <h3><i class="fas fa-history"></i> Recent Projects</h3>
          <span class="badge badge-upcoming" id="project-count">0 total</span>
        </div>
        <ul id="recent-projects-list" class="recent-list"></ul>
      </div>
    </div>
  `;

  initSidebar();

  // Helper to escape HTML
  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  // Refresh all dashboard data
  async function refreshDashboard() {
    const [kpis, reviews, projects] = await Promise.all([
      dashboardService.getKPIs(),
      dashboardService.getUpcomingReviews(),
      projectService.getAll()
    ]);

    // KPIs
    document.getElementById('kpi-container').innerHTML = renderKPIs(kpis);

    // Upcoming Reviews
    const reviewsHtml = renderUpcomingReviews(reviews);
    document.getElementById('reviews-container').innerHTML = reviewsHtml || '<p class="empty-state"><i class="fas fa-check-circle"></i> No upcoming reviews</p>';

    // Recent Projects (last 5)
    const recent = projects.slice(0, 5);
    const recentList = document.getElementById('recent-projects-list');
    recentList.innerHTML = recent.length
      ? recent.map(p => `
          <li>
            <div>
              <span class="recent-project-name">${escapeHtml(p.name)}</span>
              <span class="recent-project-client"> – ${escapeHtml(p.client) || '—'}</span>
            </div>
          </li>
        `).join('')
      : '<li class="empty-item">No projects yet</li>';

    document.getElementById('project-count').textContent = `${projects.length} total`;
  }

  // Initial load
  await refreshDashboard();

  // Quick Action: Add Project
  document.getElementById('add-project-btn').addEventListener('click', () => {
    const { close } = showModal(renderProjectForm());
    const form = document.getElementById('project-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.create(data);
        close();
        showToast('Project created', 'success');
        await refreshDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Quick Action: Record Sale
  document.getElementById('record-sale-btn').addEventListener('click', async () => {
    const allProjects = await projectService.getAll();
    const { close } = showModal(renderSaleForm(allProjects));
    const form = document.getElementById('sale-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await salesService.create(data);
        close();
        showToast('Sale recorded', 'success');
        await refreshDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}
