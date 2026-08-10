import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { dashboardService } from '../../services/dashboardService.js';
import { projectService } from '../../services/projectService.js';
import { authService } from '../../services/authService.js';
import { renderKPIs } from '../../components/kpiCards.js';
import { renderUpcomingReviews } from '../../components/upcomingReviews.js';
import { renderProjectCard } from '../../components/projectCard.js';

export async function dashboardPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <h2>Dashboard</h2>
      <div id="kpi-container"></div>
      <div id="reviews-container"></div>
      <h3>Recent Projects</h3>
      <div id="recent-projects"></div>
    </div>
  `;

  initSidebar();

  // Load data
  const [kpis, reviews, projects] = await Promise.all([
    dashboardService.getKPIs(),
    dashboardService.getUpcomingReviews(),
    projectService.getAll()
  ]);

  document.getElementById('kpi-container').innerHTML = renderKPIs(kpis);
  document.getElementById('reviews-container').innerHTML = renderUpcomingReviews(reviews);
  const recent = projects.slice(0, 5);
  document.getElementById('recent-projects').innerHTML = recent.map(p => renderProjectCard(p)).join('');
}
