export function renderSalesChart(containerId, salesData) {
  // salesData = [{month: '2025-01', total: 500}, ...]
  const ctx = document.getElementById(containerId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: salesData.map(d => d.month),
      datasets: [{
        label: 'Monthly Revenue',
        data: salesData.map(d => d.total),
      }]
    }
  });
}
