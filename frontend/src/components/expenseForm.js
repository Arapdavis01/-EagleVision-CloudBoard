export function renderExpenseForm(expense = {}, projects = []) {
  const categories = ['Domain', 'Hosting', 'Maintenance', 'Marketing', 'Software Licenses', 'Other'];
  const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'PayPal', 'Card', 'Other'];

  const projectOptions = projects
    .map(p => `<option value="${p.id}" ${Number(expense.project_id) === Number(p.id) ? 'selected' : ''}>${escapeHtml(p.name)}</option>`)
    .join('');

  return `
    <div class="form-header">
      <h2>${expense.id ? 'Edit Expense' : 'Add Expense'}</h2>
    </div>
    <form id="expense-form" class="modern-form">
      <input type="hidden" name="id" value="${expense.id || ''}">

      <!-- Project link (optional) -->
      <div class="form-group">
        <label for="expense-project"><i class="fas fa-folder-open"></i> Project</label>
        <select id="expense-project" name="project_id">
          <option value="">-- General Expense (no project) --</option>
          ${projectOptions}
        </select>
      </div>

      <!-- Quick expense templates -->
      <div class="expense-templates">
        <span class="templates-label"><i class="fas fa-bolt"></i> Quick Add:</span>
        <button type="button" class="btn btn-sm btn-outline quick-expense" data-category="Domain" data-amount="1000" data-vendor="GoDaddy">
          Domain (KSh 1,000)
        </button>
        <button type="button" class="btn btn-sm btn-outline quick-expense" data-category="Hosting" data-amount="500" data-vendor="Render">
          Hosting (KSh 500/mo)
        </button>
        <button type="button" class="btn btn-sm btn-outline quick-expense" data-category="SSL Certificate" data-amount="2500" data-vendor="SSL Provider">
          SSL (KSh 2,500)
        </button>
        <button type="button" class="btn btn-sm btn-outline quick-expense" data-category="Maintenance" data-amount="1500" data-vendor="Maintenance">
          Maintenance (KSh 1,500)
        </button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="expense-vendor"><i class="fas fa-store"></i> Vendor / Provider</label>
          <input type="text" id="expense-vendor" name="vendor" value="${escapeAttr(expense.vendor) || ''}" placeholder="e.g., GoDaddy, Render">
        </div>
        <div class="form-group">
          <label for="expense-category"><i class="fas fa-tags"></i> Category <span class="required">*</span></label>
          <select id="expense-category" name="category" required>
            ${categories.map(c => `
              <option value="${c}" ${expense.category === c ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="expense-amount"><i class="fas fa-dollar-sign"></i> Amount ($) <span class="required">*</span></label>
          <input type="number" id="expense-amount" name="amount" step="0.01" value="${expense.amount || ''}" required placeholder="0.00">
        </div>
        <div class="form-group">
          <label for="expense-date"><i class="fas fa-calendar-alt"></i> Date</label>
          <input type="date" id="expense-date" name="expense_date" value="${expense.expense_date || new Date().toISOString().slice(0,10)}" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="expense-payment-method"><i class="fas fa-credit-card"></i> Payment Method</label>
          <select id="expense-payment-method" name="payment_method">
            ${paymentMethods.map(m => `
              <option value="${m}" ${expense.payment_method === m ? 'selected' : ''}>${m}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="expense-reference"><i class="fas fa-receipt"></i> Reference / Invoice No.</label>
          <input type="text" id="expense-reference" name="reference" value="${escapeAttr(expense.reference) || ''}" placeholder="e.g., INV-1234">
        </div>
      </div>

      <div class="form-group">
        <label for="expense-notes"><i class="fas fa-sticky-note"></i> Notes</label>
        <textarea id="expense-notes" name="notes" rows="2" placeholder="Optional notes...">${escapeHtml(expense.notes) || ''}</textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline cancel-expense-btn"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save</button>
      </div>
    </form>
  `;
}

/**
 * Render a multi‑expense form for recording multiple expenses for one project at once.
 * @param {Array} projects - list of all projects for the dropdown
 * @param {number} exchangeRate - current exchange rate (KES per USD)
 */
export function renderMultipleExpenseForm(projects, exchangeRate) {
  const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'PayPal', 'Card', 'Other'];
  const commonRows = [
    { category: 'Domain', vendor: 'GoDaddy', amountKsh: 1000 },
    { category: 'Hosting', vendor: 'Render', amountKsh: 500 },
    { category: 'SSL Certificate', vendor: 'SSL Provider', amountKsh: 2500 },
    { category: 'Maintenance', vendor: 'Maintenance', amountKsh: 1500 },
  ];

  const projectOptions = projects
    .map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join('');

  const defaultRows = commonRows.map((row, index) => {
    const amountUsd = (row.amountKsh / exchangeRate).toFixed(2);
    return `
      <tr class="expense-row" data-index="${index}">
        <td>
          <select name="category_${index}" class="form-control">
            <option value="${row.category}" selected>${row.category}</option>
            <option value="Hosting">Hosting</option>
            <option value="Domain">Domain</option>
            <option value="SSL Certificate">SSL Certificate</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Marketing">Marketing</option>
            <option value="Software Licenses">Software Licenses</option>
            <option value="Other">Other</option>
          </select>
        </td>
        <td><input type="text" name="vendor_${index}" class="form-control" value="${row.vendor}" placeholder="Vendor"></td>
        <td><input type="number" name="amount_${index}" class="form-control expense-amount" step="0.01" value="${amountUsd}" placeholder="0.00"></td>
        <td>
          <select name="payment_method_${index}" class="form-control">
            ${paymentMethods.map(m => `<option value="${m}" ${m === 'Cash' ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </td>
        <td><button type="button" class="btn btn-sm btn-danger remove-row-btn"><i class="fas fa-trash"></i></button></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="form-header">
      <h2>Record Multiple Expenses</h2>
    </div>
    <form id="multiple-expense-form" class="modern-form">
      <div class="form-group">
        <label for="multi-expense-project"><i class="fas fa-folder-open"></i> Project <span class="required">*</span></label>
        <select id="multi-expense-project" name="project_id" required>
          <option value="">-- Select Project --</option>
          ${projectOptions}
        </select>
      </div>

      <div class="form-group">
        <label><i class="fas fa-calendar-alt"></i> Expense Date</label>
        <input type="date" id="multi-expense-date" name="expense_date" value="${new Date().toISOString().slice(0,10)}" required>
      </div>

      <div class="table-container" style="margin-bottom:1rem;">
        <table class="summary-table multi-expense-table" id="multi-expense-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Vendor / Provider</th>
              <th>Amount ($)</th>
              <th>Payment Method</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="multi-expense-tbody">
            ${defaultRows}
          </tbody>
        </table>
      </div>

      <div class="multi-expense-footer">
        <button type="button" id="add-row-btn" class="btn btn-outline btn-sm"><i class="fas fa-plus"></i> Add Row</button>
        <div class="multi-total">
          <strong>Total:</strong> <span id="multi-expense-total">$0.00</span>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline cancel-multi-expense-btn"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save All</button>
      </div>
    </form>
  `;
}

// Helper functions
function escapeAttr(str) {
  return str ? str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
function escapeHtml(str) {
  return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
