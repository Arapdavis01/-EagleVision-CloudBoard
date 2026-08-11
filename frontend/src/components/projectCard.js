export function renderProjectCard(project, view = 'grid') {
  const techStack = project.tech_stack
    ? JSON.parse(project.tech_stack).map(t => `<span class="tech-badge">${t}</span>`).join(' ')
    : '';
  const tags = project.tags
    ? project.tags.split(',').map(t => `<span class="tag-badge">${t.trim()}</span>`).join(' ')
    : '';

  if (view === 'grid') {
    return `
      <div class="card project-card" data-id="${project.id}">
        <div class="project-card-header">
          <h3>${escapeHtml(project.name)}</h3>
          <span class="status ${project.status.toLowerCase()}">${project.status}</span>
        </div>
        <p class="project-client"><i class="fas fa-user"></i> ${escapeHtml(project.client) || '—'}</p>
        ${project.location ? `<p class="project-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(project.location)}</p>` : ''}
        ${techStack ? `<div class="project-tech">${techStack}</div>` : ''}
        ${tags ? `<div class="project-tags">${tags}</div>` : ''}
        <div class="actions">
          <button class="btn quick-view-project" data-id="${project.id}"><i class="fas fa-eye"></i> Quick View</button>
          <button class="btn edit-project" data-id="${project.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn copy-link" data-token="${project.public_token || ''}"><i class="fas fa-link"></i> Copy Link</button>
          <button class="btn btn-danger delete-project" data-id="${project.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
  } else {
    // List view – compact row
    return `
      <div class="card project-list-row" data-id="${project.id}">
        <div class="list-row-content">
          <span class="list-name">${escapeHtml(project.name)}</span>
          <span class="list-client">${escapeHtml(project.client) || '—'}</span>
          <span class="status ${project.status.toLowerCase()}">${project.status}</span>
          <span class="list-location">${escapeHtml(project.location) || '—'}</span>
          <div class="list-actions">
            <button class="btn quick-view-project" data-id="${project.id}"><i class="fas fa-eye"></i></button>
            <button class="btn edit-project" data-id="${project.id}"><i class="fas fa-edit"></i></button>
            <button class="btn copy-link" data-token="${project.public_token || ''}"><i class="fas fa-link"></i></button>
            <button class="btn btn-danger delete-project" data-id="${project.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  }
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
