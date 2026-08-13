import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { financeService } from '../../services/financeService.js';
import { projectService } from '../../services/projectService.js';
import { dashboardService } from '../../services/dashboardService.js';
import { renderSalesChart } from '../../components/salesChart.js';
import { renderSaleForm } from '../../components/saleForm.js';
import { renderExpenseForm } from '../../components/expenseForm.js';
import { renderInvoicePreview } from '../../components/invoicePreview.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../utils/notifications.js';
import { formatCurrency, formatDate } from '../../utils/helpers.js';

let revenueChart = null;
let expenseChart = null;

export async function financePage() {
  document.body.classList.add('app-dashboard');

  const hashParams = new URLSearchParams(location.hash.split('?')[1] || '');
  let activeSection = hashParams.get('section') || 'revenue';

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="finance-header">
        <h2 id="page-title">${activeSection === 'revenue' ? 'Revenue' : 'Expenses'}</h2>
        <div class="finance-actions">
          <span id="exchange-rate-badge" class="exchange-rate-badge">
            <i class="fas fa-exchange-alt"></i> 1 USD = KSh <span id="rate-value">129</span>
          </span>
          <button id="edit-rate-btn" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></button>
        </div>
      </div>

      <!-- Dynamic section container -->
      <div id="finance-section-container"></div>
    </div>
  `;

  initSidebar();

  // State
  let exchangeRate = 129;
  let allProjects = [];

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  function formatDualCurrency(usdAmount) {
    const usd = parseFloat(usdAmount);
    const kes = usd * exchangeRate;
    return `$${usd.toLocaleString()} (KSh ${kes.toLocaleString()})`;
  }

  function updateRateBadge() {
    document.getElementById('rate-value').textContent = exchangeRate;
  }

  async function loadExchangeRate() {
    try {
      const prefs = await dashboardService.getPreferences();
      exchangeRate = prefs.exchange_rate || 129;
      updateRateBadge();
    } catch (err) {
      console.warn('Could not load exchange rate', err);
    }
  }

  async function loadProjects() {
    try {
      allProjects = await projectService.getAll();
    } catch (err) {
      console.warn('Could not load projects', err);
      allProjects = [];
    }
  }

  // ==================== PERIOD FILTER HELPER ====================
  function setPeriodFilter(period, dateFromInput, dateToInput, refreshFn) {
    const now = new Date();
    let from = '';
    let to = '';
    if (period === 'this-month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10);
    } else if (period === 'last-month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0,10);
      to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10);
    } else if (period === 'this-year') {
      from = `${now.getFullYear()}-01-01`;
      to = `${now.getFullYear()}-12-31`;
    } else {
      from = '';
      to = '';
    }
    dateFromInput.value = from;
    dateToInput.value = to;
    refreshFn();
  }

  // ==================== REVENUE SECTION ====================
  function renderRevenueSection() {
    const container = document.getElementById('finance-section-container');
    container.innerHTML = `
      <div class="finance-actions">
        <button id="record-sale-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Record Sale</button>
        <button id="export-revenue-csv-btn" class="btn btn-outline"><i class="fas fa-download"></i> Export CSV</button>
      </div>

      <div class="filter-bar period-filter-bar">
        <button class="filter-pill active" data-period="all">All Time</button>
        <button class="filter-pill" data-period="this-month">This Month</button>
        <button class="filter-pill" data-period="last-month">Last Month</button>
        <button class="filter-pill" data-period="this-year">This Year</button>
      </div>

      <div id="revenue-kpi-container" class="kpi-grid">
        ${renderRevenuePlaceholderKPIs()}
      </div>

      <div class="card compact-card" style="margin-bottom:1rem;">
        <h3><i class="fas fa-balance-scale"></i> Net Income (Revenue − Expenses)</h3>
        <div id="revenue-net-income-value" class="value" style="font-size:1.5rem;">--</div>
      </div>

      <div class="card chart-card compact-chart" style="margin-bottom:1rem;">
        <h3><i class="fas fa-chart-line"></i> Monthly Revenue</h3>
        <canvas id="revenueChartCanvas"></canvas>
      </div>

      <div class="finance-toolbar">
        <input type="text" id="revenue-search" placeholder="Search by project name...">
        <input type="month" id="revenue-date-from" title="From date">
        <input type="month" id="revenue-date-to" title="To date">
        <button id="clear-revenue-filters-btn" class="btn btn-outline btn-sm"><i class="fas fa-times"></i> Clear</button>
      </div>

      <div class="table-container card">
        <table id="revenue-table" class="summary-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="project_name">Project <i class="fas fa-sort"></i></th>
              <th class="sortable" data-sort="amount">Amount <i class="fas fa-sort"></i></th>
              <th class="sortable" data-sort="sale_date">Date <i class="fas fa-sort"></i></th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="revenue-tbody">
            <tr><td colspan="5" class="empty-state">Loading revenue…</td></tr>
          </tbody>
        </table>
      </div>
      <div id="revenue-pagination" class="pagination-bar"></div>
    `;

    initRevenueSection();
  }

  function renderRevenuePlaceholderKPIs() {
    return ['Total Revenue','Revenue This Month','Average Sale','Total Sales']
      .map((title, i) => {
        const icons = ['fa-dollar-sign','fa-calendar-week','fa-chart-line','fa-receipt'];
        return `<div class="card kpi-card compact-kpi"><i class="fas ${icons[i]} kpi-icon"></i><h3>${title}</h3><div class="value">--</div></div>`;
      }).join('');
  }

  function initRevenueSection() {
    let allRevenue = [];
    let currentPage = 1;
    const pageSize = 10;
    let sortField = 'sale_date';
    let sortDir = 'desc';
    let searchTerm = '';
    let dateFrom = '';
    let dateTo = '';
    let activePeriod = 'all';

    const searchInput = document.getElementById('revenue-search');
    const dateFromInput = document.getElementById('revenue-date-from');
    const dateToInput = document.getElementById('revenue-date-to');
    const clearBtn = document.getElementById('clear-revenue-filters-btn');
    const tbody = document.getElementById('revenue-tbody');
    const pagination = document.getElementById('revenue-pagination');
    const kpiContainer = document.getElementById('revenue-kpi-container');
    const netIncomeValue = document.getElementById('revenue-net-income-value');

    async function loadRevenue() {
      try {
        allRevenue = await financeService.getRevenue();
      } catch (err) {
        console.error(err);
        showToast('Failed to load revenue.', 'error');
        allRevenue = [];
      }
      updateRevenueKPIs(allRevenue);
      updateRevenueChart(allRevenue);
      updateNetIncome();
      applyFiltersAndSort();
    }

    function updateRevenueKPIs(revenue) {
      const totalRevenue = revenue.reduce((sum, s) => sum + parseFloat(s.amount), 0);
      const now = new Date();
      const thisMonth = revenue.filter(s => {
        const d = new Date(s.sale_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const thisMonthRevenue = thisMonth.reduce((sum, s) => sum + parseFloat(s.amount), 0);
      const avgSale = revenue.length ? totalRevenue / revenue.length : 0;

      kpiContainer.innerHTML = `
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-dollar-sign kpi-icon"></i>
          <h3>Total Revenue</h3>
          <div class="value">${formatDualCurrency(totalRevenue)}</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-calendar-week kpi-icon"></i>
          <h3>Revenue This Month</h3>
          <div class="value">${formatDualCurrency(thisMonthRevenue)}</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-chart-line kpi-icon"></i>
          <h3>Average Sale</h3>
          <div class="value">${formatDualCurrency(avgSale)}</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-receipt kpi-icon"></i>
          <h3>Total Sales</h3>
          <div class="value">${revenue.length}</div>
        </div>
      `;
    }

    function updateRevenueChart(revenue) {
      const monthly = {};
      revenue.forEach(s => {
        const month = s.sale_date.substring(0, 7);
        monthly[month] = (monthly[month] || 0) + parseFloat(s.amount);
      });
      const sortedMonths = Object.keys(monthly).sort();
      const chartData = sortedMonths.map(m => ({ month: m, total: monthly[m] }));
      renderSalesChart('revenueChartCanvas', chartData, exchangeRate, 'Revenue (USD)');
    }

    async function updateNetIncome() {
      try {
        const net = await financeService.getNetIncome();
        netIncomeValue.innerHTML = `${formatDualCurrency(net.net_income)} <br><small>Revenue: $${net.total_revenue.toLocaleString()} | Expenses: $${net.total_expense.toLocaleString()}</small>`;
      } catch (err) {
        console.warn('Could not load net income', err);
      }
    }

    function applyFiltersAndSort() {
      let filtered = [...allRevenue];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(s => s.project_name?.toLowerCase().includes(term));
      }
      if (dateFrom) filtered = filtered.filter(s => s.sale_date >= dateFrom);
      if (dateTo) filtered = filtered.filter(s => s.sale_date <= dateTo);

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

      const totalPages = Math.ceil(filtered.length / pageSize);
      currentPage = Math.min(currentPage, totalPages || 1);
      const start = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      renderRevenueTable(pageItems);
      renderRevenuePagination(totalPages);
    }

    function renderRevenueTable(pageItems) {
      if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No sales found.</td></tr>`;
        return;
      }
      tbody.innerHTML = pageItems.map(s => `
        <tr data-id="${s.id}">
          <td>${escapeHtml(s.project_name) || 'Unknown'}</td>
          <td>${formatDualCurrency(s.amount)}</td>
          <td>${formatDate(s.sale_date)}</td>
          <td>${s.notes ? escapeHtml(s.notes.substring(0,30)) + (s.notes.length > 30 ? '…' : '') : ''}</td>
          <td class="actions-cell">
            <button class="btn btn-sm view-invoice"><i class="fas fa-file-invoice"></i></button>
            <button class="btn btn-sm btn-danger delete-revenue"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    }

    function renderRevenuePagination(totalPages) {
      if (totalPages <= 1) { pagination.innerHTML = ''; return; }
      let html = '';
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      pagination.innerHTML = html;
    }

    document.querySelectorAll('.period-filter-bar .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.period-filter-bar .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activePeriod = pill.dataset.period;
        setPeriodFilter(activePeriod, dateFromInput, dateToInput, applyFiltersAndSort);
      });
    });

    searchInput.addEventListener('input', e => { searchTerm = e.target.value; currentPage = 1; applyFiltersAndSort(); });
    dateFromInput.addEventListener('change', e => { dateFrom = e.target.value; currentPage = 1; applyFiltersAndSort(); });
    dateToInput.addEventListener('change', e => { dateTo = e.target.value; currentPage = 1; applyFiltersAndSort(); });
    clearBtn.addEventListener('click', () => {
      searchTerm = dateFrom = dateTo = '';
      searchInput.value = dateFromInput.value = dateToInput.value = '';
      document.querySelectorAll('.period-filter-bar .filter-pill').forEach(p => p.classList.remove('active'));
      document.querySelector('.period-filter-bar .filter-pill[data-period="all"]').classList.add('active');
      activePeriod = 'all';
      currentPage = 1;
      applyFiltersAndSort();
    });

    document.querySelectorAll('#revenue-table .sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = field; sortDir = 'asc'; }
        currentPage = 1;
        applyFiltersAndSort();
        document.querySelectorAll('#revenue-table .sortable i').forEach(i => i.className = 'fas fa-sort');
        th.querySelector('i').className = sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
      });
    });

    pagination.addEventListener('click', e => {
      const btn = e.target.closest('.page-btn');
      if (!btn) return;
      currentPage = parseInt(btn.dataset.page);
      applyFiltersAndSort();
    });

    document.getElementById('revenue-table').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const row = e.target.closest('tr');
      const id = row?.dataset.id;
      if (!id) return;

      if (btn.classList.contains('delete-revenue')) {
        const sale = allRevenue.find(s => s.id == id);
        if (!sale) return;
        if (!confirm(`Delete sale of $${parseFloat(sale.amount).toLocaleString()}?`)) return;
        financeService.deleteRevenue(id)
          .then(() => { showToast('Sale deleted', 'info'); loadRevenue(); })
          .catch(err => showToast(err.message, 'error'));
      } else if (btn.classList.contains('view-invoice')) {
        const sale = allRevenue.find(s => s.id == id);
        if (sale) showModal(renderInvoicePreview(sale));
      }
    });

    document.getElementById('record-sale-btn').addEventListener('click', async () => {
      await loadProjects();
      const { close } = showModal(renderSaleForm(allProjects));
      document.getElementById('sale-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
          await financeService.createRevenue(data);
          close();
          showToast('Sale recorded', 'success');
          loadRevenue();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    document.getElementById('export-revenue-csv-btn').addEventListener('click', () => {
      const rows = [['Project','Amount (USD)','Amount (KES)','Date','Notes']];
      allRevenue.forEach(s => {
        rows.push([
          s.project_name || 'Unknown',
          parseFloat(s.amount).toFixed(2),
          (parseFloat(s.amount) * exchangeRate).toFixed(2),
          s.sale_date,
          s.notes || ''
        ]);
      });
      exportCSV(rows, `revenue_export_${new Date().toISOString().slice(0,10)}.csv`);
    });

    loadRevenue();
  }

  // ==================== EXPENSE SECTION ====================
  function renderExpenseSection() {
    const container = document.getElementById('finance-section-container');
    container.innerHTML = `
      <div class="finance-actions">
        <button id="add-expense-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Expense</button>
        <button id="export-expenses-csv-btn" class="btn btn-outline"><i class="fas fa-download"></i> Export CSV</button>
      </div>

      <div class="filter-bar period-filter-bar">
        <button class="filter-pill active" data-period="all">All Time</button>
        <button class="filter-pill" data-period="this-month">This Month</button>
        <button class="filter-pill" data-period="last-month">Last Month</button>
        <button class="filter-pill" data-period="this-year">This Year</button>
      </div>

      <div id="expense-kpi-container" class="kpi-grid">
        ${renderExpensePlaceholderKPIs()}
      </div>

      <div class="card compact-card" style="margin-bottom:1rem;">
        <h3><i class="fas fa-balance-scale"></i> Net Income (Revenue − Expenses)</h3>
        <div id="expense-net-income-value" class="value" style="font-size:1.5rem;">--</div>
      </div>

      <div class="card chart-card compact-chart" style="margin-bottom:1rem;">
        <h3><i class="fas fa-chart-bar"></i> Monthly Expenses</h3>
        <canvas id="expenseChartCanvas"></canvas>
      </div>

      <div class="finance-toolbar">
        <input type="text" id="expense-search" placeholder="Search by category or notes...">
        <input type="month" id="expense-date-from" title="From date">
        <input type="month" id="expense-date-to" title="To date">
        <button id="clear-expense-filters-btn" class="btn btn-outline btn-sm"><i class="fas fa-times"></i> Clear</button>
      </div>

      <div class="table-container card">
        <table id="expense-table" class="summary-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="category">Category <i class="fas fa-sort"></i></th>
              <th>Project</th>
              <th class="sortable" data-sort="amount">Amount <i class="fas fa-sort"></i></th>
              <th class="sortable" data-sort="expense_date">Date <i class="fas fa-sort"></i></th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="expense-tbody">
            <tr><td colspan="6" class="empty-state">Loading expenses…</td></tr>
          </tbody>
        </table>
      </div>
      <div id="expense-pagination" class="pagination-bar"></div>
    `;

    initExpenseSection();
  }

  function renderExpensePlaceholderKPIs() {
    return ['Total Expenses','Expenses This Month','Average Expense','Expense Count']
      .map((title, i) => {
        const icons = ['fa-wallet','fa-calendar-week','fa-calculator','fa-receipt'];
        return `<div class="card kpi-card compact-kpi"><i class="fas ${icons[i]} kpi-icon"></i><h3>${title}</h3><div class="value">--</div></div>`;
      }).join('');
  }

  function initExpenseSection() {
    let allExpenses = [];
    let currentPage = 1;
    const pageSize = 10;
    let sortField = 'expense_date';
    let sortDir = 'desc';
    let searchTerm = '';
    let dateFrom = '';
    let dateTo = '';
    let activePeriod = 'all';

    const searchInput = document.getElementById('expense-search');
    const dateFromInput = document.getElementById('expense-date-from');
    const dateToInput = document.getElementById('expense-date-to');
    const clearBtn = document.getElementById('clear-expense-filters-btn');
    const tbody = document.getElementById('expense-tbody');
    const pagination = document.getElementById('expense-pagination');
    const kpiContainer = document.getElementById('expense-kpi-container');
    const netIncomeValue = document.getElementById('expense-net-income-value');

    async function loadExpenses() {
      try {
        allExpenses = await financeService.getExpenses();
      } catch (err) {
        console.error(err);
        showToast('Failed to load expenses.', 'error');
        allExpenses = [];
      }
      updateExpenseKPIs(allExpenses);
      updateExpenseChart(allExpenses);
      updateNetIncome();
      applyFiltersAndSort();
    }

    function updateExpenseKPIs(expenses) {
      const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const now = new Date();
      const thisMonth = expenses.filter(e => {
        const d = new Date(e.expense_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const monthExpense = thisMonth.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const avgExpense = expenses.length ? totalExpense / expenses.length : 0;

      kpiContainer.innerHTML = `
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-wallet kpi-icon"></i>
          <h3>Total Expenses</h3>
          <div class="value">${formatDualCurrency(totalExpense)}</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-calendar-week kpi-icon"></i>
          <h3>Expenses This Month</h3>
          <div class="value">${formatDualCurrency(monthExpense)}</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-calculator kpi-icon"></i>
          <h3>Average Expense</h3>
          <div class="value">${formatDualCurrency(avgExpense)}</div>
        </div>
        <div class="card kpi-card compact-kpi">
          <i class="fas fa-receipt kpi-icon"></i>
          <h3>Expense Count</h3>
          <div class="value">${expenses.length}</div>
        </div>
      `;
    }

    function updateExpenseChart(expenses) {
      const monthly = {};
      expenses.forEach(e => {
        const month = e.expense_date.substring(0, 7);
        monthly[month] = (monthly[month] || 0) + parseFloat(e.amount);
      });
      const sortedMonths = Object.keys(monthly).sort();
      const chartData = sortedMonths.map(m => ({ month: m, total: monthly[m] }));
      renderSalesChart('expenseChartCanvas', chartData, exchangeRate, 'Expenses (USD)');
    }

    async function updateNetIncome() {
      try {
        const net = await financeService.getNetIncome();
        netIncomeValue.innerHTML = `${formatDualCurrency(net.net_income)} <br><small>Revenue: $${net.total_revenue.toLocaleString()} | Expenses: $${net.total_expense.toLocaleString()}</small>`;
      } catch (err) {
        console.warn('Could not load net income', err);
      }
    }

    function applyFiltersAndSort() {
      let filtered = [...allExpenses];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(e => (e.category + ' ' + (e.notes || '') + ' ' + (e.project_name || '')).toLowerCase().includes(term));
      }
      if (dateFrom) filtered = filtered.filter(e => e.expense_date >= dateFrom);
      if (dateTo) filtered = filtered.filter(e => e.expense_date <= dateTo);

      filtered.sort((a, b) => {
        let valA, valB;
        if (sortField === 'amount') {
          valA = parseFloat(a.amount);
          valB = parseFloat(b.amount);
        } else if (sortField === 'expense_date') {
          valA = new Date(a.expense_date);
          valB = new Date(b.expense_date);
        } else {
          valA = (a[sortField] || '').toLowerCase();
          valB = (b[sortField] || '').toLowerCase();
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      const totalPages = Math.ceil(filtered.length / pageSize);
      currentPage = Math.min(currentPage, totalPages || 1);
      const start = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      renderExpenseTable(pageItems);
      renderExpensePagination(totalPages);
    }

    function renderExpenseTable(pageItems) {
      if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No expenses found.</td></tr>`;
        return;
      }
      tbody.innerHTML = pageItems.map(e => `
        <tr data-id="${e.id}">
          <td><span class="category-badge">${escapeHtml(e.category)}</span></td>
          <td>${escapeHtml(e.project_name) || '—'}</td>
          <td>${formatDualCurrency(e.amount)}</td>
          <td>${formatDate(e.expense_date)}</td>
          <td>${e.notes ? escapeHtml(e.notes.substring(0,30)) + (e.notes.length > 30 ? '…' : '') : ''}</td>
          <td class="actions-cell">
            <button class="btn btn-sm edit-expense"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger delete-expense"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    }

    function renderExpensePagination(totalPages) {
      if (totalPages <= 1) { pagination.innerHTML = ''; return; }
      let html = '';
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      pagination.innerHTML = html;
    }

    document.querySelectorAll('.period-filter-bar .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.period-filter-bar .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activePeriod = pill.dataset.period;
        setPeriodFilter(activePeriod, dateFromInput, dateToInput, applyFiltersAndSort);
      });
    });

    searchInput.addEventListener('input', e => { searchTerm = e.target.value; currentPage = 1; applyFiltersAndSort(); });
    dateFromInput.addEventListener('change', e => { dateFrom = e.target.value; currentPage = 1; applyFiltersAndSort(); });
    dateToInput.addEventListener('change', e => { dateTo = e.target.value; currentPage = 1; applyFiltersAndSort(); });
    clearBtn.addEventListener('click', () => {
      searchTerm = dateFrom = dateTo = '';
      searchInput.value = dateFromInput.value = dateToInput.value = '';
      document.querySelectorAll('.period-filter-bar .filter-pill').forEach(p => p.classList.remove('active'));
      document.querySelector('.period-filter-bar .filter-pill[data-period="all"]').classList.add('active');
      activePeriod = 'all';
      currentPage = 1;
      applyFiltersAndSort();
    });

    document.querySelectorAll('#expense-table .sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = field; sortDir = 'asc'; }
        currentPage = 1;
        applyFiltersAndSort();
        document.querySelectorAll('#expense-table .sortable i').forEach(i => i.className = 'fas fa-sort');
        th.querySelector('i').className = sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
      });
    });

    pagination.addEventListener('click', e => {
      const btn = e.target.closest('.page-btn');
      if (!btn) return;
      currentPage = parseInt(btn.dataset.page);
      applyFiltersAndSort();
    });

    document.getElementById('expense-table').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const row = e.target.closest('tr');
      const id = row?.dataset.id;
      if (!id) return;

      if (btn.classList.contains('delete-expense')) {
        const expense = allExpenses.find(x => x.id == id);
        if (!expense) return;
        if (!confirm(`Delete expense of $${parseFloat(expense.amount).toLocaleString()}?`)) return;
        financeService.deleteExpense(id)
          .then(() => { showToast('Expense deleted', 'info'); loadExpenses(); })
          .catch(err => showToast(err.message, 'error'));
      } else if (btn.classList.contains('edit-expense')) {
        const expense = allExpenses.find(x => x.id == id);
        if (!expense) return;
        loadProjects().then(() => {
          const { close } = showModal(renderExpenseForm(expense, allProjects));
          attachQuickExpenseTemplates();
          document.getElementById('expense-form')?.addEventListener('submit', async ev => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const data = Object.fromEntries(fd.entries());
            try {
              await financeService.updateExpense(id, data);
              close();
              showToast('Expense updated', 'success');
              loadExpenses();
            } catch (err) { showToast(err.message, 'error'); }
          });
          document.querySelector('.cancel-expense-btn')?.addEventListener('click', () => close());
        });
      }
    });

    document.getElementById('add-expense-btn').addEventListener('click', () => {
      loadProjects().then(() => {
        const { close } = showModal(renderExpenseForm({}, allProjects));
        attachQuickExpenseTemplates();
        document.getElementById('expense-form')?.addEventListener('submit', async e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const data = Object.fromEntries(fd.entries());
          try {
            await financeService.createExpense(data);
            close();
            showToast('Expense added', 'success');
            loadExpenses();
          } catch (err) { showToast(err.message, 'error'); }
        });
        document.querySelector('.cancel-expense-btn')?.addEventListener('click', () => close());
      });
    });

    // Quick expense template buttons
    function attachQuickExpenseTemplates() {
      document.querySelectorAll('.quick-expense').forEach(btn => {
        btn.addEventListener('click', () => {
          const category = btn.dataset.category;
          const vendor = btn.dataset.vendor;
          const amountKsh = parseFloat(btn.dataset.amount);
          const amountUsd = amountKsh / exchangeRate;

          document.getElementById('expense-category').value = category;
          document.getElementById('expense-vendor').value = vendor;
          document.getElementById('expense-amount').value = amountUsd.toFixed(2);
        });
      });
    }

    document.getElementById('export-expenses-csv-btn').addEventListener('click', () => {
      const rows = [['Category','Project','Amount (USD)','Amount (KES)','Date','Notes']];
      allExpenses.forEach(e => {
        rows.push([
          e.category,
          e.project_name || '',
          parseFloat(e.amount).toFixed(2),
          (parseFloat(e.amount) * exchangeRate).toFixed(2),
          e.expense_date,
          e.notes || ''
        ]);
      });
      exportCSV(rows, `expenses_export_${new Date().toISOString().slice(0,10)}.csv`);
    });

    loadExpenses();
  }

  // ==================== UTILITY ====================
  function exportCSV(rows, filename) {
    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==================== SECTION SWITCHING ====================
  function switchSection(section) {
    activeSection = section;
    document.getElementById('page-title').textContent = section === 'revenue' ? 'Revenue' : 'Expenses';
    if (section === 'revenue') {
      renderRevenueSection();
    } else {
      renderExpenseSection();
    }
  }

  // ==================== EXCHANGE RATE ====================
  document.getElementById('edit-rate-btn').addEventListener('click', () => {
    const content = `
      <h3>Update Exchange Rate</h3>
      <div class="form-group">
        <label>1 USD = KSh</label>
        <input type="number" id="new-rate-input" value="${exchangeRate}" step="1" min="1" required>
      </div>
      <button id="save-rate-btn" class="btn btn-primary">Save</button>
    `;
    const { close } = showModal(content);
    document.getElementById('save-rate-btn').addEventListener('click', async () => {
      const newRate = parseFloat(document.getElementById('new-rate-input').value);
      if (!newRate || newRate <= 0) {
        showToast('Please enter a valid rate.', 'error');
        return;
      }
      try {
        await dashboardService.updatePreferences({ exchange_rate: newRate });
        exchangeRate = newRate;
        updateRateBadge();
        close();
        showToast('Exchange rate updated', 'success');
        switchSection(activeSection);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // ==================== INITIAL LOAD ====================
  await loadExchangeRate();
  await loadProjects();
  switchSection(activeSection);
}
