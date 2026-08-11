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

let statusChart = null;

export async function dashboardPage() {
  // ✅ Activate the green/gold glass‑morphism theme
  document.body.classList.add('app-dashboard');

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

      <!-- KPI Cards -->
      <div id="kpi-container"></div>

      <!-- Pending Revenue Card (only if > 0) -->
      <div id="pending-revenue-container"></div>

      <!-- Status Distribution Chart -->
      <div class="card chart-card" id="status-chart-container">
        <h3><i class="fas fa-chart-pie"></i> Project Status Breakdown</h3>
        <canvas id="statusChartCanvas"></canvas>
      </div>

      <!-- Overdue Reviews -->
      <div id="overdue-reviews-container" class="card" style="margin-bottom:2rem;"></div>

      <!-- Upcoming Reviews -->
      <div id="reviews-container"></div>

      <!-- County Breakdown & For-Sale Projects side-by-side -->
      <div class="dashboard-grid">
        <div id="county-breakdown-container" class="card"></div>
        <div id="for-sale-container" class="card"></div>
      </div>

      <!-- Recent Projects -->
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

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  // Refresh all dashboard data
  async function refreshDashboard() {
    const [kpis, upcomingReviews, overdueReviews, statusDist, pendingRevenue, counties, projects, forSale] =
      await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getUpcomingReviews(),
        dashboardService.getOverdueReviews().catch(() => []),
        dashboardService.getStatusDistribution().catch(() => []),
        dashboardService.getPendingRevenue().catch(() => ({ total_pending: 0 })),
        dashboardService.getCountyBreakdown().catch(() => []),
        projectService.getAll(),
        dashboardService.getForSaleProjects().catch(() => [])
      ]);

    // 1. KPI Cards (clickable)
    document.getElementById('kpi-container').innerHTML = renderClickableKPIs(kpis);

    // 2. Pending Revenue
    const pendingRevHtml = pendingRevenue.total_pending > 0 ? `
      <div class="card kpi-card pending-revenue-card">
        <i class="fas fa-hand-holding-usd kpi-icon"></i>
        <h3>Pending Revenue (For Sale)</h3>
        <div class="value">$${pendingRevenue.total_pending.toLocaleString()}</div>
      </div>
    ` : '';
    document.getElementById('pending-revenue-container').innerHTML = pendingRevHtml;

    // 3. Status Distribution Chart
    renderStatusChart(statusDist);

    // 4. Overdue Reviews
    const overdueHtml = renderOverdueReviews(overdueReviews);
    document.getElementById('overdue-reviews-container').innerHTML = overdueHtml || '';

    // 5. Upcoming Reviews
    const upcomingHtml = renderUpcomingReviews(upcomingReviews);
    document.getElementById('reviews-container').innerHTML = upcomingHtml || '<p class="empty-state"><i class="fas fa-check-circle"></i> No upcoming reviews</p>';

    // 6. County Breakdown
    const countyHtml = renderCountyBreakdown(counties);
    document.getElementById('county-breakdown-container').innerHTML = countyHtml || '<p class="empty-state"><i class="fas fa-map-marker-alt"></i> No location data</p>';

    // 7. Projects for Sale
    const forSaleHtml = renderForSaleProjects(forSale);
    document.getElementById('for-sale-container').innerHTML = forSaleHtml;

    // 8. Recent Projects
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

  // --- Event Listeners ---

  // Clickable KPI cards
  document.getElementById('kpi-container').addEventListener('click', (e) => {
    const card = e.target.closest('.clickable');
    if (!card) return;
    const filter = card.dataset.filter;
    location.hash = `#projects?filter=${filter}`;
  });

  // Add Project
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

  // Record Sale
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

// ===== Helper renderers =====

function renderClickableKPIs(data) {
  return `
    <div class="kpi-grid">
      <div class="card kpi-card clickable" data-filter="all">
        <i class="fas fa-folder-open kpi-icon"></i>
        <h3>Total Projects</h3>
        <div class="value">${data.total_projects}</div>
      </div>
      <div class="card kpi-card clickable" data-filter="live">
        <i class="fas fa-rocket kpi-icon"></i>
        <h3>Live Projects</h3>
        <div class="value">${data.live_projects}</div>
      </div>
      <div class="card kpi-card clickable" data-filter="clients">
        <i class="fas fa-users kpi-icon"></i>
        <h3>Active Clients</h3>
        <div class="value">${data.active_clients}</div>
      </div>
      <div class="card kpi-card clickable" data-filter="revenue">
        <i class="fas fa-dollar-sign kpi-icon"></i>
        <h3>Total Revenue</h3>
        <div class="value">$${data.total_revenue.toLocaleString()}</div>
      </div>
    </div>
  `;
}

function renderStatusChart(distribution) {
  if (!distribution || distribution.length === 0) return;

  const ctx = document.getElementById('statusChartCanvas')?.getContext('2d');
  if (!ctx) return;

  if (statusChart) statusChart.destroy();

  const labels = distribution.map(d => d.status);
  const counts = distribution.map(d => parseInt(d.count));
  const colors = {
    'Live': '#10b981',
    'Development': '#3b82f6',
    'Planning': '#f59e0b',
    'Maintenance': '#8b5cf6',
    'Archived': '#6b7280'
  };

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: labels.map(l => colors[l] || '#cbd5e1'),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20, usePointStyle: true }
        }
      }
    }
  });
}

function renderOverdueReviews(overdue) {
  if (!overdue || overdue.length === 0) return '';

  const now = new Date();
  return `
    <div class="card overdue-card" style="border-left: 4px solid #ef4444; margin-bottom: 2rem;">
      <h3><i class="fas fa-exclamation-circle" style="color:#ef4444;"></i> Overdue Reviews</h3>
      <ul class="recent-list">
        ${overdue.map(r => {
          const dueDate = new Date(r.next_review_date);
          const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          return `
            <li class="review-item">
              <div>
                <span class="recent-project-name">${r.name}</span>
                <span class="review-client"> – ${r.client || '—'}</span>
              </div>
              <div>
                <span class="badge badge-overdue">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</span>
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

function renderCountyBreakdown(counties) {
  if (!counties || counties.length === 0) return '';

  return `
    <h3><i class="fas fa-map-marker-alt"></i> Top Counties</h3>
    <ul class="county-list">
      ${counties.map(c => `
        <li>
          <span class="county-name">${c.location || 'Unknown'}</span>
          <span class="county-count">${c.project_count} project${c.project_count !== 1 ? 's' : ''}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderForSaleProjects(forSale) {
  if (!forSale || forSale.length === 0) {
    return `
      <h3><i class="fas fa-tag"></i> Projects for Sale</h3>
      <p class="empty-state"><i class="fas fa-info-circle"></i> No projects marked for sale</p>
    `;
  }

  return `
    <h3><i class="fas fa-tag"></i> Projects for Sale</h3>
    <ul class="for-sale-list">
      ${forSale.map(p => `
        <li>
          <div>
            <span class="recent-project-name">${p.name}</span>
            <span class="recent-project-client"> – ${p.client || '—'}</span>
          </div>
          <span class="asking-price">$${p.asking_price ? Number(p.asking_price).toLocaleString() : '—'}</span>
        </li>
      `).join('')}
    </ul>
  `;
}
