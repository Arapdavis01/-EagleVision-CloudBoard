export function renderProjectCard(project, view = 'grid') {
  // simplified card for grid
  return `
    <div class="project-card" data-id="${project.id}">
      <h3>${project.name}</h3>
      <p>Client: ${project.client || '—'}</p>
      <span class="status ${project.status.toLowerCase()}">${project.status}</span>
      <div class="actions">
        <button class="btn edit-project" data-id="${project.id}">Edit</button>
        <button class="btn delete-project" data-id="${project.id}">Delete</button>
      </div>
    </div>
  `;
}
