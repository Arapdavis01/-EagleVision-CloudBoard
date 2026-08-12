let salesChartInstance = null;

export function renderSalesChart(canvasId, chartData, exchangeRate = 129) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (salesChartInstance) salesChartInstance.destroy();

  salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(d => d.month),
      datasets: [{
        label: 'Revenue (USD)',
        data: chartData.map(d => d.total),
        backgroundColor: '#1a472a',
        hoverBackgroundColor: '#c49a2b',
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const usd = ctx.raw;
              const kes = usd * exchangeRate;
              return `$${usd.toLocaleString()} (KSh ${kes.toLocaleString()})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: (value) => '$' + value
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}
