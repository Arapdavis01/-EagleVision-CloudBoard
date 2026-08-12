export function renderExpenseForm(expense = {}) {
  const categories = ['Domain', 'Hosting', 'Maintenance', 'Marketing', 'Software Licenses', 'Other'];

  return `
    <div class="form-header">
      <h2>${expense.id ? 'Edit Expense' : 'Add Expense'}</h2>
    </div>
    <form id="expense-form" class="modern-form">
      <input type="hidden" name="id" value="${expense.id || ''}">

      <div class="form-row">
        <div class="form-group">
          <label for="expense-category">Category</label>
          <select id="expense-category" name="category" required>
            ${categories.map(c => `
              <option value="${c}" ${expense.category === c ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="expense-amount">Amount ($)</label>
          <input type="number" id="expense-amount" name="amount" step="0.01" value="${expense.amount || ''}" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="expense-date">Date</label>
          <input type="date" id="expense-date" name="expense_date" value="${expense.expense_date || new Date().toISOString().slice(0,10)}" required>
        </div>
        <div class="form-group">
          <label for="expense-notes">Notes</label>
          <input type="text" id="expense-notes" name="notes" value="${escapeAttr(expense.notes) || ''}">
        </div>
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
