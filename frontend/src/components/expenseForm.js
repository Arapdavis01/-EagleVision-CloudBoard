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

function escapeAttr(str) {
  return str ? str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
function escapeHtml(str) {
  return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
