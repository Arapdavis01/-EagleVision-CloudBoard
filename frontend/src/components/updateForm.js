export function renderUpdateForm(projectId, update = {}) {
  const updateTypes = ['Feature', 'Bug Fix', 'Maintenance', 'Upgrade', 'Other'];

  return `
    <div class="form-header">
      <h2>${update.id ? 'Edit Update' : 'Add Update'}</h2>
    </div>
    <form id="update-form" class="modern-form project-update-form">
      <input type="hidden" name="project_id" value="${projectId || update.project_id || ''}">
      <input type="hidden" name="id" value="${update.id || ''}">

      <div class="form-row">
        <div class="form-group">
          <label for="update-type"><i class="fas fa-tag"></i> Update Type <span class="required">*</span></label>
          <select id="update-type" name="update_type" required>
            ${updateTypes.map(t => `
              <option value="${t}" ${update.update_type === t ? 'selected' : ''}>${t}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="update-cost"><i class="fas fa-dollar-sign"></i> Cost ($)</label>
          <input type="number" id="update-cost" name="cost" step="0.01" value="${update.cost || ''}" placeholder="0.00">
        </div>
      </div>

      <div class="form-group">
        <label for="update-title"><i class="fas fa-heading"></i> Title <span class="required">*</span></label>
        <input type="text" id="update-title" name="title" value="${escapeAttr(update.title) || ''}" required placeholder="e.g., Fixed login bug">
      </div>

      <div class="form-group">
        <label for="update-description"><i class="fas fa-align-left"></i> Description</label>
        <textarea id="update-description" name="description" rows="4" placeholder="Describe what was done...">${escapeHtml(update.description) || ''}</textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline cancel-update-btn"><i class="fas fa-arrow-left"></i> Back</button>
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
