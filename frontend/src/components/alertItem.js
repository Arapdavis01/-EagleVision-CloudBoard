export function renderAlertItem(alert) {
  return `
    <div class="alert-item">
      <strong>${alert.name}</strong> (${alert.live_url}) - Down since ${new Date(alert.checked_at).toLocaleString()}
      <button class="btn resolve-alert" data-project-id="${alert.id}">Resolve</button>
    </div>
  `;
}
