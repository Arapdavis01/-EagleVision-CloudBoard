export function renderProjectForm(project = {}) {
  // returns HTML string for add/edit form
  return `
    <h2>${project.id ? 'Edit Project' : 'Add Project'}</h2>
    <form id="project-form">
      <input type="hidden" name="id" value="${project.id || ''}">
      <label>Name: <input name="name" value="${project.name || ''}" required></label>
      <label>Client: <input name="client" value="${project.client || ''}"></label>
      <label>Live URL: <input name="live_url" value="${project.live_url || ''}"></label>
      <label>GitHub: <input name="github" value="${project.github || ''}"></label>
      <label>Hosting: <input name="hosting" value="${project.hosting || ''}"></label>
      <label>Location: <input name="location" value="${project.location || ''}"></label>
      <label>Description: <textarea name="description">${project.description || ''}</textarea></label>
      <label>Tech Stack (JSON): <input name="tech_stack" value='${project.tech_stack ? JSON.stringify(project.tech_stack) : ''}'></label>
      <label>Tags: <input name="tags" value="${project.tags || ''}"></label>
      <label>Next Review Date: <input type="date" name="next_review_date" value="${project.next_review_date || ''}"></label>
      <label>Thumbnail URL: <input name="thumbnail_url" value="${project.thumbnail_url || ''}"></label>
      <label>Status:
        <select name="status">
          ${['Planning','Development','Live','Maintenance','Archived'].map(s => `<option value="${s}" ${project.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>
      <button type="submit" class="btn">Save</button>
    </form>
  `;
}
