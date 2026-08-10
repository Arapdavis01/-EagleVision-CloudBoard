let chartInstance = null;

export function renderSalesChart(canvasId, chartData) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // Destroy previous chart if exists
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(d => d.month),
      datasets: [{
        label: 'Monthly Revenue ($)',
        data: chartData.map(d => d.total),
        backgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
