import { loginPage } from './pages/login/login.js';
import { dashboardPage } from './pages/dashboard/dashboard.js';
import { projectsPage } from './pages/projects/projects.js';
import { financePage } from './pages/finance/finance.js';
import { alertsPage } from './pages/alerts/alerts.js';

const routes = {
  '#login': loginPage,
  '#dashboard': dashboardPage,
  '#projects': projectsPage,
  '#finance': financePage,
  '#alerts': alertsPage,
};

export async function initRouter() {
  const hash = location.hash || '#login';
  const pageLoader = routes[hash];
  if (pageLoader) {
    try {
      await pageLoader();
    } catch (err) {
      console.error('Page load error:', err);
      document.getElementById('app').innerHTML = '<p>Error loading page.</p>';
    }
  } else {
    document.getElementById('app').innerHTML = '<p>Page not found.</p>';
  }
}

window.addEventListener('hashchange', initRouter);
