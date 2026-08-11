export function renderProjectForm(project = {}) {
  return `
    <div class="form-header">
      <h2>${project.id ? 'Edit Project' : 'Add Project'}</h2>
    </div>
    <form id="project-form" class="modern-form">
      <input type="hidden" name="id" value="${project.id || ''}">
      
      <div class="form-row">
        <div class="form-group">
          <label for="project-name"><i class="fas fa-tag"></i> Name <span class="required">*</span></label>
          <input id="project-name" name="name" value="${escapeAttr(project.name) || ''}" required placeholder="e.g., E‑portfolio">
        </div>
        <div class="form-group">
          <label for="project-client"><i class="fas fa-user"></i> Client</label>
          <input id="project-client" name="client" value="${escapeAttr(project.client) || ''}" placeholder="Client name or company">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="project-live-url"><i class="fas fa-globe"></i> Live URL</label>
          <input id="project-live-url" name="live_url" value="${escapeAttr(project.live_url) || ''}" placeholder="https://...">
        </div>
        <div class="form-group">
          <label for="project-github"><i class="fab fa-github"></i> GitHub</label>
          <input id="project-github" name="github" value="${escapeAttr(project.github) || ''}" placeholder="https://github.com/...">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="project-hosting"><i class="fas fa-server"></i> Hosting</label>
          <input id="project-hosting" name="hosting" value="${escapeAttr(project.hosting) || ''}" placeholder="e.g., Render, Vercel">
        </div>
        <div class="form-group">
          <label for="project-location"><i class="fas fa-map-marker-alt"></i> Location (County)</label>
          <input id="project-location" name="location" list="counties-list" value="${escapeAttr(project.location) || ''}" placeholder="Search county...">
          <datalist id="counties-list">
            ${COUNTIES.map(c => `<option value="${c}">`).join('')}
          </datalist>
        </div>
      </div>

      <div class="form-group">
        <label for="project-description"><i class="fas fa-align-left"></i> Description</label>
        <textarea id="project-description" name="description" rows="3" placeholder="Brief description of the project">${escapeHtml(project.description) || ''}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="project-tech-stack"><i class="fas fa-code"></i> Tech Stack (JSON)</label>
          <input id="project-tech-stack" name="tech_stack" value='${project.tech_stack ? JSON.stringify(project.tech_stack) : ''}' placeholder='["React", "Node.js"]'>
        </div>
        <div class="form-group">
          <label for="project-tags"><i class="fas fa-hashtag"></i> Tags</label>
          <input id="project-tags" name="tags" value="${escapeAttr(project.tags) || ''}" placeholder="comma, separated">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="project-next-review"><i class="fas fa-calendar-alt"></i> Next Review Date</label>
          <input type="date" id="project-next-review" name="next_review_date" value="${project.next_review_date || ''}">
        </div>
        <div class="form-group">
          <label for="project-thumbnail"><i class="fas fa-image"></i> Thumbnail URL</label>
          <input id="project-thumbnail" name="thumbnail_url" value="${escapeAttr(project.thumbnail_url) || ''}" placeholder="https://...">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="project-status"><i class="fas fa-chart-line"></i> Status</label>
          <select id="project-status" name="status">
            ${['Planning','Development','Live','Maintenance','Archived'].map(s => `
              <option value="${s}" ${project.status === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group"></div>
      </div>

      <hr class="form-divider">
      <h3><i class="fas fa-tag"></i> Sale Opportunity</h3>
      <div class="form-row">
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" name="for_sale" value="true" ${project.for_sale ? 'checked' : ''}>
            Mark as For Sale
          </label>
        </div>
        <div class="form-group">
          <label for="project-asking-price"><i class="fas fa-dollar-sign"></i> Asking Price ($)</label>
          <input type="number" id="project-asking-price" name="asking_price" step="0.01" value="${project.asking_price || ''}" placeholder="0.00">
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline cancel-form-btn"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save</button>
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

// All 47 Kenya counties
const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta",
  "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga",
  "Wajir", "West Pokot"
];
