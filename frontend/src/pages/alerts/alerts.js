import { uptimeService } from '../../services/uptimeService.js';
import { renderAlertItem } from '../../components/alertItem.js';
import { showToast } from '../../utils/notifications.js';

export async function alertsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="sidebar">...</div>
    <div class="main-content">
      <h2>Alerts</h2>
      <div id="alerts-container"></div>
    </div>
  `;

  const alerts = await uptimeService.getAlerts();
  document.getElementById('alerts-container').innerHTML = alerts.length
    ? alerts.map(a => renderAlertItem(a)).join('')
    : '<p>No down projects.</p>';

  document.querySelectorAll('.resolve-alert').forEach(btn => {
    btn.onclick = async () => {
      await uptimeService.resolveAlert(btn.dataset.projectId);
      showToast('Alert acknowledged', 'info');
      // reload
      alertsPage();
    };
  });
}
