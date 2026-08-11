import { authService } from '../services/authService.js';

let sidebarInitialized = false;   // prevent duplicate listener bindings

export function renderSidebar() {
  return `
    <div class="sidebar">
      <h1><i class="fas fa-eye"></i> EagleVision</h1>
      <a href="#dashboard" class="nav-link" data-page="dashboard"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
      <a href="#projects" class="nav-link" data-page="projects"><i class="fas fa-folder-open"></i> Projects</a>
      <a href="#finance" class="nav-link" data-page="finance"><i class="fas fa-dollar-sign"></i> Finance</a>
      <a href="#alerts" class="nav-link" data-page="alerts"><i class="fas fa-exclamation-triangle"></i> Alerts</a>
      <button id="logout-btn" class="btn logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
    </div>
  `;
}

export function initSidebar() {
  // Highlight current page
  const currentPage = location.hash.replace('#', '') || 'dashboard';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === currentPage);
  });

  // Bind logout only once
  if (sidebarInitialized) return;
  sidebarInitialized = true;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authService.logout();   // clears token, removes app-dashboard class, redirects to #login
    });
  }
}
