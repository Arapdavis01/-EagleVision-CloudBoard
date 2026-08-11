import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { dashboardService } from '../../services/dashboardService.js';
import { projectService } from '../../services/projectService.js';
import { salesService } from '../../services/salesService.js';
import { showModal } from '../../components/modal.js';
import { renderProjectForm } from '../../components/projectForm.js';
import { renderSaleForm } from '../../components/saleForm.js';
import { showToast } from '../../utils/notifications.js';

let statusChart = null;

export async function dashboardPage() {
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content compact-dashboard">
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        <div class="quick-actions">
          <button id="add-project-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Project</button>
          <button id="record-sale-btn" class="btn btn-outline"><i class="fas fa-receipt"></i> Record Sale</button>
        </div>
      </div>

      <!-- KPI Row -->
      <div id="kpi-container" class="kpi-grid">
        ${renderPlaceholderKPIs()}
      </div>

      <!-- Pending Revenue (only if > 0) -->
      <div id="pending-revenue-container"></div>

      <!-- Chart + Reviews Side by Side -->
      <div class="dashboard-row">
        <div class="card chart-card compact-chart">
          <h3><i class="fas fa-chart-pie"></i> Status Breakdown</h3>
          <canvas id="statusChartCanvas"></canvas>
        </div>
        <div class="card reviews-card">
          <div id="overdue-reviews-container"></div>
          <div id="reviews-container"></div>
        </div>
      </div>

      <!-- County & For-Sale Side by Side -->
      <div class="dashboard-row">
        <div id="county-breakdown-container" class="card compact-card"></div>
        <div id="for-sale-container" class="card compact-card"></div>
      </div>
    </div>
  `;

  initSidebar();

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  // Data refresh
  async function refreshDashboard() {
    const kpiPromise = dashboardService.getKPIs();
    const pendingRevenuePromise = dashboardService.getPendingRevenue().catch(() => ({ total_pending: 0 }));
    const upcomingReviewsPromise = dashboardService.getUpcomingReviews().catch(() => []);
    const overdueReviewsPromise = dashboardService.getOverdueReviews().catch(() => []);
    const statusDistPromise = dashboardService.getStatusDistribution().catch(() => []);
    const countiesPromise = dashboardService.getCountyBreakdown().catch(() => []);
    const forSalePromise = dashboardService.getForSaleProjects().catch(() => []);

    // KPIs
    kpiPromise.then(kpis => {
      document.getElementById('kpi-container').innerHTML = renderClickableKPIs(kpis);
    });

    // Pending revenue
    pendingRevenuePromise.then(pendingRevenue => {
      const html = pendingRevenue.total_pending > 0 ? `
        <div class="card kpi-card pending-revenue-card compact-kpi">
          <i class="fas fa-hand-holding-usd kpi-icon"></i>
          <h3>Pending Revenue</h3>
          <div class="value">$${pendingRevenue.total_pending.toLocaleString()}</div>
        </div>
      ` : '';
      document.getElementById('pending-revenue-container').innerHTML = html;
    });

    const [upcomingReviews, overdueReviews, statusDist, counties, forSale] = await Promise.all([
      upcomingReviewsPromise, overdueReviewsPromise, statusDistPromise, countiesPromise, forSalePromise
    ]);

    // Chart
    renderStatusChart(statusDist);

    // Overdue & Upcoming reviews (compact versions)
    document.getElementById('overdue-reviews-container').innerHTML = renderOverdueReviewsCompact(overdueReviews);
    document.getElementById('reviews-container').innerHTML = renderUpcomingReviewsCompact(upcomingReviews);

    // County breakdown
    document.getElementById('county-breakdown-container').innerHTML = renderCountyBreakdown(counties) || '<p class="empty-state small"><i class="fas fa-map-marker-alt"></i> No location data</p>';

    // For-sale projects
    document.getElementById('for-sale-container').innerHTML = renderForSaleProjectsCompact(forSale);
  }

  refreshDashboard();

  // --- Event listeners ---

  // Clickable KPI cards
  document.getElementById('kpi-container').addEventListener('click', (e) => {
    const card = e.target.closest('.clickable');
    if (!card) return;
    const filter = card.dataset.filter;
    location.hash = `#projects?filter=${filter}`;
  });

  // Add Project button
  document.getElementById('add-project-btn').addEventListener('click', () => {
    const { close } = showModal(renderProjectForm());
    const form = document.getElementById('project-form');

    // ✅ Back button closes the modal
    const cancelBtn = document.querySelector('.cancel-form-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        close();
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.create(data);
        close();
        showToast('Project created', 'success');
        refreshDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Record Sale button
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
        refreshDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

// --- Render helpers (unchanged) ---

function renderPlaceholderKPIs() {
  return `
    <div class="card kpi-card clickable compact-kpi" data-filter="all">
      <i class="fas fa-folder-open kpi-icon"></i>
      <h3>Total Projects</h3>
      <div class="value">--</div>
    </div>
    <div class="card kpi-card clickable compact-kpi" data-filter="live">
      <i class="fas fa-rocket kpi-icon"></i>
      <h3>Live Projects</h3>
      <div class="value">--</div>
    </div>
    <div class="card kpi-card clickable compact-kpi" data-filter="clients">
      <i class="fas fa-users kpi-icon"></i>
      <h3>Active Clients</h3>
      <div class="value">--</div>
    </div>
    <div class="card kpi-card clickable compact-kpi" data-filter="revenue">
      <i class="fas fa-dollar-sign kpi-icon"></i>
      <h3>Total Revenue</h3>
      <div class="value">--</div>
    </div>
  `;
}

function renderClickableKPIs(data) {
  return `
    <div class="card kpi-card clickable compact-kpi" data-filter="all">
      <i class="fas fa-folder-open kpi-icon"></i>
      <h3>Total Projects</h3>
      <div class="value">${data.total_projects}</div>
    </div>
    <div class="card kpi-card clickable compact-kpi" data-filter="live">
      <i class="fas fa-rocket kpi-icon"></i>
      <h3>Live Projects</h3>
      <div class="value">${data.live_projects}</div>
    </div>
    <div class="card kpi-card clickable compact-kpi" data-filter="clients">
      <i class="fas fa-users kpi-icon"></i>
      <h3>Active Clients</h3>
      <div class="value">${data.active_clients}</div>
    </div>
    <div class="card kpi-card clickable compact-kpi" data-filter="revenue">
      <i class="fas fa-dollar-sign kpi-icon"></i>
      <h3>Total Revenue</h3>
      <div class="value">$${data.total_revenue.toLocaleString()}</div>
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
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { padding: 8, usePointStyle: true, boxWidth: 8 }
        }
      }
    }
  });
}

function renderOverdueReviewsCompact(overdue) {
  if (!overdue || overdue.length === 0) return '';
  const now = new Date();
  return `
    <h4><i class="fas fa-exclamation-circle" style="color:#ef4444;"></i> Overdue</h4>
    <ul class="compact-list">
      ${overdue.map(r => {
        const dueDate = new Date(r.next_review_date);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        return `<li><strong>${r.name}</strong> <span class="badge badge-overdue">${daysOverdue}d</span></li>`;
      }).join('')}
    </ul>
  `;
}

function renderUpcomingReviewsCompact(upcoming) {
  if (!upcoming || upcoming.length === 0) return '<p class="empty-state small">No upcoming reviews</p>';
  return `
    <h4><i class="fas fa-calendar-alt"></i> Upcoming</h4>
    <ul class="compact-list">
      ${upcoming.map(r => `<li><strong>${r.name}</strong> – ${new Date(r.next_review_date).toLocaleDateString()}</li>`).join('')}
    </ul>
  `;
}

function renderCountyBreakdown(counties) {
  if (!counties || counties.length === 0) return '';
  return `
    <h3><i class="fas fa-map-marker-alt"></i> Top Counties</h3>
    <ul class="compact-list">
      ${counties.map(c => `<li><span>${c.location}</span> <strong>${c.project_count}</strong></li>`).join('')}
    </ul>
  `;
}

function renderForSaleProjectsCompact(forSale) {
  if (!forSale || forSale.length === 0) {
    return `<h3><i class="fas fa-tag"></i> For Sale</h3><p class="empty-state small">None</p>`;
  }
  return `
    <h3><i class="fas fa-tag"></i> For Sale</h3>
    <ul class="compact-list">
      ${forSale.map(p => `<li><span>${p.name}</span> <strong>$${p.asking_price ? Number(p.asking_price).toLocaleString() : '0'}</strong></li>`).join('')}
    </ul>
  `;
}
