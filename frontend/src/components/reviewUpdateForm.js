export function renderReviewUpdateForm(project, defaults = {}) {
  const updateTypes = ['Feature', 'Bug Fix', 'Maintenance', 'Upgrade', 'Other'];
  const statuses = ['Planning', 'Development', 'Live', 'Maintenance', 'Archived'];

  // Default next review date: +30 days from today
  const defaultNextReview = new Date();
  defaultNextReview.setDate(defaultNextReview.getDate() + 30);
  const defaultDateStr = defaultNextReview.toISOString().slice(0, 10);

  return `
    <div class="form-header">
      <h2>Review & Update</h2>
    </div>
    <form id="review-update-form" class="modern-form">
      <input type="hidden" name="project_id" value="${project.id}">

      <div class="form-group">
        <label><i class="fas fa-folder-open"></i> Project</label>
        <input type="text" value="${escapeAttr(project.name)}" disabled>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="ru-update-type"><i class="fas fa-tag"></i> Update Type <span class="required">*</span></label>
          <select id="ru-update-type" name="update_type" required>
            ${updateTypes.map(t => `
              <option value="${t}" ${defaults.update_type === t ? 'selected' : ''}>${t}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="ru-cost"><i class="fas fa-dollar-sign"></i> Cost ($)</label>
          <input type="number" id="ru-cost" name="cost" step="0.01" value="${defaults.cost || ''}" placeholder="0.00">
        </div>
      </div>

      <div class="form-group">
        <label for="ru-title"><i class="fas fa-heading"></i> Title <span class="required">*</span></label>
        <input type="text" id="ru-title" name="title" value="${escapeAttr(defaults.title || '')}" required placeholder="e.g., Periodic Review">
      </div>

      <div class="form-group">
        <label for="ru-description"><i class="fas fa-align-left"></i> Description</label>
        <textarea id="ru-description" name="description" rows="3" placeholder="What was done?">${escapeHtml(defaults.description || '')}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="ru-next-review"><i class="fas fa-calendar-alt"></i> Next Review Date</label>
          <input type="date" id="ru-next-review" name="next_review_date" value="${defaults.next_review_date || defaultDateStr}">
        </div>
        <div class="form-group">
          <label for="ru-status"><i class="fas fa-chart-line"></i> Project Status</label>
          <select id="ru-status" name="status">
            ${statuses.map(s => `
              <option value="${s}" ${project.status === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline cancel-review-update-btn"><i class="fas fa-arrow-left"></i> Back</button>
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
