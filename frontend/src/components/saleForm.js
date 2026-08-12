export function renderSaleForm(projects) {
  const projectOptions = projects
    .map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join('');

  return `
    <div class="form-header">
      <h2>Record Sale</h2>
    </div>
    <form id="sale-form" class="modern-form">
      <div class="form-row">
        <div class="form-group">
          <label for="sale-project">
            <i class="fas fa-folder-open"></i> Project <span class="required">*</span>
          </label>
          <select id="sale-project" name="project_id" required>
            <option value="">-- Select --</option>
            ${projectOptions}
          </select>
        </div>
        <div class="form-group">
          <label for="sale-amount">
            <i class="fas fa-dollar-sign"></i> Amount ($) <span class="required">*</span>
          </label>
          <input type="number" id="sale-amount" name="amount" step="0.01" required placeholder="0.00">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="sale-date">
            <i class="fas fa-calendar-alt"></i> Sale Date
          </label>
          <input type="date" id="sale-date" name="sale_date" value="${new Date().toISOString().slice(0,10)}" required>
        </div>
        <div class="form-group">
          <label for="sale-payment-method">
            <i class="fas fa-credit-card"></i> Payment Method
          </label>
          <select id="sale-payment-method" name="payment_method">
            ${['Cash', 'M-Pesa', 'Bank Transfer', 'PayPal', 'Other']
              .map(m => `<option value="${m}">${m}</option>`)
              .join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="sale-notes">
          <i class="fas fa-sticky-note"></i> Notes
        </label>
        <textarea id="sale-notes" name="notes" rows="2" placeholder="Optional notes..."></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline cancel-sale-btn">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-save"></i> Record
        </button>
      </div>
    </form>
  `;
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
