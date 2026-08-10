export function renderProjectCard(project, view = 'grid') {
  const statusClass = project.status.toLowerCase();
  if (view === 'grid') {
    return `
      <div class="project-card grid-card" data-id="${project.id}">
        <h3>${escapeHtml(project.name)}</h3>
        <p>Client: ${escapeHtml(project.client) || '—'}</p>
        <span class="status ${statusClass}">${project.status}</span>
        <div class="actions">
          <button class="btn edit-project" data-id="${project.id}">Edit</button>
          <button class="btn delete-project" data-id="${project.id}">Delete</button>
          <button class="btn copy-link" data-token="${project.public_token || ''}">Copy Public Link</button>
        </div>
      </div>
    `;
  } else { // list view
    return `
      <div class="project-card list-card" data-id="${project.id}">
        <div class="list-row">
          <strong>${escapeHtml(project.name)}</strong>
          <span>Client: ${escapeHtml(project.client) || '—'}</span>
          <span class="status ${statusClass}">${project.status}</span>
          <div class="actions">
            <button class="btn edit-project" data-id="${project.id}">Edit</button>
            <button class="btn delete-project" data-id="${project.id}">Delete</button>
            <button class="btn copy-link" data-token="${project.public_token || ''}">Copy Link</button>
          </div>
        </div>
      </div>
    `;
  }
}

// helper to prevent XSS
function escapeHtml(text) {
  return text ? text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
}
