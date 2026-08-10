import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { salesService } from '../../services/salesService.js';
import { projectService } from '../../services/projectService.js';
import { renderSalesChart } from '../../components/salesChart.js';
import { renderSaleForm } from '../../components/saleForm.js';
import { renderInvoicePreview } from '../../components/invoicePreview.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../utils/notifications.js';
import { formatCurrency, formatDate } from '../../utils/helpers.js';

export async function financePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <h2>Finance</h2>
      <button id="record-sale-btn" class="btn">Record Sale</button>
      <div id="sales-chart-container" class="chart-container">
        <canvas id="salesChartCanvas"></canvas>
      </div>
      <div id="sales-table-container">
        <table id="sales-table">
          <thead>
            <tr><th>Project</th><th>Amount</th><th>Date</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  initSidebar();

  // Load data and render
  const [sales, projects] = await Promise.all([
    salesService.getAll(),
    projectService.getAll()
  ]);

  renderSalesList(sales);
  prepareChart(sales);

  // Event Listeners
  document.getElementById('record-sale-btn').addEventListener('click', async () => {
    const { close } = showModal(renderSaleForm(projects));
    document.getElementById('sale-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      try {
        await salesService.create(data);
        close();
        const updatedSales = await salesService.getAll();
        renderSalesList(updatedSales);
        prepareChart(updatedSales);
        showToast('Sale recorded', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Inline edit/delete buttons (use event delegation)
  document.getElementById('sales-table').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row || row.dataset.id == null) return;

    const saleId = row.dataset.id;
    const sale = sales.find(s => s.id == saleId);

    if (e.target.classList.contains('delete-sale')) {
      if (confirm('Delete this sale?')) {
        salesService.delete(saleId).then(async () => {
          const updated = await salesService.getAll();
          renderSalesList(updated);
          prepareChart(updated);
          showToast('Sale deleted', 'info');
        }).catch(err => showToast(err.message, 'error'));
      }
    } else if (e.target.classList.contains('view-invoice')) {
      showModal(renderInvoicePreview(sale));
    }
  });

  function renderSalesList(salesList) {
    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = salesList.map(s => `
      <tr data-id="${s.id}">
        <td>${escapeHtml(s.project_name) || 'Unknown'}</td>
        <td>${formatCurrency(s.amount)}</td>
        <td>${formatDate(s.sale_date)}</td>
        <td>${s.notes ? escapeHtml(s.notes.substring(0,30)) : ''}</td>
        <td>
          <button class="btn view-invoice">Invoice</button>
          <button class="btn delete-sale">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function prepareChart(salesList) {
    // aggregate by month
    const monthly = {};
    salesList.forEach(s => {
      const month = s.sale_date.substring(0, 7); // YYYY-MM
      monthly[month] = (monthly[month] || 0) + parseFloat(s.amount);
    });
    const sortedMonths = Object.keys(monthly).sort();
    const chartData = sortedMonths.map(m => ({ month: m, total: monthly[m] }));
    renderSalesChart('salesChartCanvas', chartData);
  }
}
