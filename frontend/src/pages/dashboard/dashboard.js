import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { dashboardService } from '../../services/dashboardService.js';
import { projectService } from '../../services/projectService.js';
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Dashboard</h2>
        <div class="quick-actions">
          <button id="add-project-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Project</button>
          <button id="record-sale-btn" class="btn btn-outline"><i class="fas fa-receipt"></i> Record Sale</button>
        </div>
      </div>

      <div id="kpi-container"></div>
      <div id="reviews-container"></div>
      <div id="recent-projects-container" class="card" style="margin-top: 2rem;">
        <h3 style="margin-bottom: 1rem;"><i class="fas fa-history"></i> Recent Projects</h3>
        <ul id="recent-projects-list" class="recent-list"></ul>
      </div>
    </div>
  `;

  initSidebar();

  // Load data
  const [kpis, reviews, projects] = await Promise.all([
    dashboardService.getKPIs(),
    dashboardService.getUpcomingReviews(),
    projectService.getAll()
  ]);

  // Render KPIs
  document.getElementById('kpi-container').innerHTML = renderKPIs(kpis);

  // Render Upcoming / Overdue Reviews
  document.getElementById('reviews-container').innerHTML = renderUpcomingReviews(reviews);

  // Render Recent Projects (last 5)
  const recent = projects.slice(0, 5);
  const recentList = document.getElementById('recent-projects-list');
  recentList.innerHTML = recent.map(p => `
    <li>
      <div>
        <span class="recent-project-name">${escapeHtml(p.name)}</span>
        <span class="recent-project-client"> – ${escapeHtml(p.client) || '—'}</span>
      </div>
    </li>
  `).join('');

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
        // Refresh dashboard data
        const newProjects = await projectService.getAll();
        const recent5 = newProjects.slice(0, 5);
        document.getElementById('recent-projects-list').innerHTML = recent5.map(p => `
          <li>
            <div>
              <span class="recent-project-name">${escapeHtml(p.name)}</span>
              <span class="recent-project-client"> – ${escapeHtml(p.client) || '—'}</span>
            </div>
          </li>
        `).join('');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Quick Action: Record Sale
  document.getElementById('record-sale-btn').addEventListener('click', async () => {
    // Need to fetch projects for the sale form dropdown
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
        // Refresh KPIs
        const newKPIs = await dashboardService.getKPIs();
        document.getElementById('kpi-container').innerHTML = renderKPIs(newKPIs);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function escapeHtml(text) {
  return text ? text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
}
