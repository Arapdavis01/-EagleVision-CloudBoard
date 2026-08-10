export function renderKPIs(data) {
  return `
    <div class="kpi-grid">
      <div class="card kpi-card">
        <i class="fas fa-folder-open kpi-icon"></i>
        <h3>Total Projects</h3>
        <div class="value">${data.total_projects}</div>
      </div>
      <div class="card kpi-card">
        <i class="fas fa-rocket kpi-icon"></i>
        <h3>Live Projects</h3>
        <div class="value">${data.live_projects}</div>
      </div>
      <div class="card kpi-card">
        <i class="fas fa-users kpi-icon"></i>
        <h3>Active Clients</h3>
        <div class="value">${data.active_clients}</div>
      </div>
      <div class="card kpi-card">
        <i class="fas fa-dollar-sign kpi-icon"></i>
        <h3>Total Revenue</h3>
        <div class="value">$${data.total_revenue.toLocaleString()}</div>
      </div>
    </div>
  `;
}
