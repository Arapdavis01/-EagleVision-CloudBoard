export function renderSidebar() {
  return `
    <div class="sidebar">
      <h1>🦅 EagleVision</h1>
      <a href="#dashboard" class="nav-link" data-page="dashboard">Dashboard</a>
      <a href="#projects" class="nav-link" data-page="projects">Projects</a>
      <a href="#finance" class="nav-link" data-page="finance">Finance</a>
      <a href="#alerts" class="nav-link" data-page="alerts">Alerts</a>
      <button id="logout-btn" class="btn logout-btn">Logout</button>
    </div>
  `;
}

// Call this after rendering to highlight active link and bind logout
export function initSidebar() {
  const currentPage = location.hash.replace('#', '') || 'dashboard';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === currentPage) link.classList.add('active');
    else link.classList.remove('active');
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { authService } = await import('../services/authService.js');
      await authService.logout();
      location.hash = '#login';
    });
  }
}
