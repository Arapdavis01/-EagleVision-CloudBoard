import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { salesService } from '../../services/salesService.js';
import { projectService } from '../../services/projectService.js';
import { renderSalesChart } from '../../components/salesChart.js';
import { renderSaleForm } from '../../components/saleForm.js';
import { renderInvoicePreview } from '../../components/invoicePreview.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../utils/notifications.js';
import { formatCurrency, formatDate } from '../../utils/helpers.js';

let salesChart = null;

export async function financePage() {
  // ✅ Activate glass‑morphism theme
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="finance-header">
        <h2>Finance</h2>
        <div class="finance-actions">
          <button id="record-sale-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Record Sale</button>
          <button id="export-csv-btn" class="btn btn-outline"><i class="fas fa-download"></i> Export CSV</button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div id="finance-kpi-container" class="kpi-grid">
        ${renderPlaceholderFinanceKPIs()}
      </div>

      <!-- Revenue Chart -->
      <div id="sales-chart-container" class="card chart-card compact-chart" style="margin-bottom:1rem;">
        <h3><i class="fas fa-chart-line"></i> Monthly Revenue</h3>
        <canvas id="salesChartCanvas"></canvas>
      </div>

      <!-- Filters & Search -->
      <div class="finance-toolbar">
        <input type="text" id="finance-search" placeholder="Search by project name...">
        <input type="month" id="finance-date-from" title="From date">
        <input type="month" id="finance-date-to" title="To date">
        <button id="clear-filters-btn" class="btn btn-outline btn-sm"><i class="fas fa-times"></i> Clear</button>
      </div>

      <!-- Sales Table -->
      <div class="table-container card">
        <table id="sales-table" class="summary-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="project_name">Project <i class="fas fa-sort"></i></th>
              <th class="sortable" data-sort="amount">Amount <i class="fas fa-sort"></i></th>
              <th class="sortable" data-sort="sale_date">Date <i class="fas fa-sort"></i></th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sales-tbody"></tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div id="pagination-container" class="pagination-bar"></div>
    </div>
  `;

  initSidebar();

  // --- State ---
  let allSales = [];
  let currentPage = 1;
  const pageSize = 10;
  let sortField = 'sale_date';
  let sortDir = 'desc';
  let searchTerm = '';
  let dateFrom = '';
  let dateTo = '';

  // --- DOM refs ---
  const searchInput = document.getElementById('finance-search');
  const dateFromInput = document.getElementById('finance-date-from');
  const dateToInput = document.getElementById('finance-date-to');
  const clearBtn = document.getElementById('clear-filters-btn');
  const tbody = document.getElementById('sales-tbody');
  const paginationContainer = document.getElementById('pagination-container');
  const kpiContainer = document.getElementById('finance-kpi-container');

  // --- Helpers ---
  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  // Placeholder KPI cards
  function renderPlaceholderFinanceKPIs() {
    return ['Total Revenue','Revenue This Month','Average Sale','Total Sales']
      .map((title, i) => {
        const icons = ['fa-dollar-sign','fa-calendar-week','fa-chart-line','fa-receipt'];
        return `<div class="card kpi-card compact-kpi"><i class="fas ${icons[i]} kpi-icon"></i><h3>${title}</h3><div class="value">--</div></div>`;
      }).join('');
  }

  // --- Load all data ---
  async function loadData() {
    try {
      allSales = await salesService.getAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to load sales.', 'error');
      allSales = [];
    }
    updateKPIs(allSales);
    updateChart(allSales);
    applyFiltersAndSort();
  }

  // --- KPI updates ---
  function updateKPIs(sales) {
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const now = new Date();
    const thisMonth = sales.filter(s => {
      const d = new Date(s.sale_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthRevenue = thisMonth.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const avgSale = sales.length ? totalRevenue / sales.length : 0;

    kpiContainer.innerHTML = `
      <div class="card kpi-card compact-kpi"><i class="fas fa-dollar-sign kpi-icon"></i><h3>Total Revenue</h3><div class="value">$${totalRevenue.toLocaleString()}</div></div>
      <div class="card kpi-card compact-kpi"><i class="fas fa-calendar-week kpi-icon"></i><h3>Revenue This Month</h3><div class="value">$${thisMonthRevenue.toLocaleString()}</div></div>
      <div class="card kpi-card compact-kpi"><i class="fas fa-chart-line kpi-icon"></i><h3>Average Sale</h3><div class="value">$${avgSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
      <div class="card kpi-card compact-kpi"><i class="fas fa-receipt kpi-icon"></i><h3>Total Sales</h3><div class="value">${sales.length}</div></div>
    `;
  }

  // --- Chart update ---
  function updateChart(sales) {
    const monthly = {};
    sales.forEach(s => {
      const month = s.sale_date.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + parseFloat(s.amount);
    });
    const sortedMonths = Object.keys(monthly).sort();
    const chartData = sortedMonths.map(m => ({ month: m, total: monthly[m] }));
    renderSalesChart('salesChartCanvas', chartData);
  }

  // --- Filtering + Sorting + Pagination ---
  function applyFiltersAndSort() {
    let filtered = [...allSales];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.project_name?.toLowerCase().includes(term));
    }

    // Date range
    if (dateFrom) {
      filtered = filtered.filter(s => s.sale_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(s => s.sale_date <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'amount') {
        valA = parseFloat(a.amount);
        valB = parseFloat(b.amount);
      } else if (sortField === 'sale_date') {
        valA = new Date(a.sale_date);
        valB = new Date(b.sale_date);
      } else {
        valA = (a[sortField] || '').toLowerCase();
        valB = (b[sortField] || '').toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / pageSize);
    currentPage = Math.min(currentPage, totalPages || 1);
    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    renderTable(pageItems);
    renderPagination(totalPages);
  }

  function renderTable(pageItems) {
    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No sales found.</td></tr>`;
      return;
    }
    tbody.innerHTML = pageItems.map(s => `
      <tr data-id="${s.id}">
        <td>${escapeHtml(s.project_name) || 'Unknown'}</td>
        <td>${formatCurrency(s.amount)}</td>
        <td>${formatDate(s.sale_date)}</td>
        <td>${s.notes ? escapeHtml(s.notes.substring(0, 30)) + (s.notes.length > 30 ? '…' : '') : ''}</td>
        <td class="actions-cell">
          <button class="btn btn-sm view-invoice"><i class="fas fa-file-invoice"></i></button>
          <button class="btn btn-sm btn-danger delete-sale"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    paginationContainer.innerHTML = html;
  }

  // --- Event Listeners ---

  // Search
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Date filters
  dateFromInput.addEventListener('change', (e) => {
    dateFrom = e.target.value;
    currentPage = 1;
    applyFiltersAndSort();
  });
  dateToInput.addEventListener('change', (e) => {
    dateTo = e.target.value;
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Clear filters
  clearBtn.addEventListener('click', () => {
    searchTerm = '';
    dateFrom = '';
    dateTo = '';
    searchInput.value = '';
    dateFromInput.value = '';
    dateToInput.value = '';
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Sortable headers
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDir = 'asc';
      }
      currentPage = 1;
      applyFiltersAndSort();
      // Update header icons (visual feedback)
      document.querySelectorAll('.sortable i').forEach(i => i.className = 'fas fa-sort');
      const icon = th.querySelector('i');
      if (icon) icon.className = sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    });
  });

  // Pagination clicks
  paginationContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (!btn) return;
    currentPage = parseInt(btn.dataset.page);
    applyFiltersAndSort();
  });

  // Table actions (invoice / delete)
  document.getElementById('sales-table').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = e.target.closest('tr');
    const saleId = row?.dataset.id;
    if (!saleId) return;

    if (btn.classList.contains('delete-sale')) {
      const sale = allSales.find(s => s.id == saleId);
      if (!sale) return;
      if (!confirm(`Delete sale of $${parseFloat(sale.amount).toLocaleString()}?`)) return;
      salesService.delete(saleId)
        .then(() => {
          showToast('Sale deleted', 'info');
          loadData();
        })
        .catch(err => showToast(err.message, 'error'));
    } else if (btn.classList.contains('view-invoice')) {
      const sale = allSales.find(s => s.id == saleId);
      if (!sale) return;
      showModal(renderInvoicePreview(sale));
    }
  });

  // Record Sale
  document.getElementById('record-sale-btn').addEventListener('click', async () => {
    const projects = await projectService.getAll().catch(() => []);
    const { close } = showModal(renderSaleForm(projects));
    document.getElementById('sale-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      try {
        await salesService.create(data);
        close();
        showToast('Sale recorded', 'success');
        loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Export CSV
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    const rows = [['Project','Amount','Date','Notes']];
    allSales.forEach(s => rows.push([
      s.project_name || 'Unknown',
      s.amount,
      s.sale_date,
      s.notes || ''
    ]));
    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  });

  // Initial load
  loadData();
}
