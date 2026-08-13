export function renderShowcaseCard(project) {
  const thumbnailUrl = project.thumbnail_url || '';
  const imageHtml = thumbnailUrl
    ? `<img class="showcase-thumbnail" src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(project.name)}" loading="lazy" />`
    : `<div class="showcase-placeholder"><i class="fas fa-image"></i></div>`;

  // Tech badges (up to 3)
  const techList = parseTechStack(project.tech_stack).slice(0, 3);
  const techBadges = techList
    .map(t => `<span class="tech-badge">${escapeHtml(t)}</span>`)
    .join('');

  return `
    <div class="showcase-card" data-id="${project.id}">
      <div class="showcase-thumbnail-wrapper">
        ${imageHtml}
        <div class="showcase-overlay">
          <button class="btn btn-sm quick-view-showcase" data-id="${project.id}"><i class="fas fa-eye"></i> Quick View</button>
          <button class="btn btn-sm edit-showcase" data-id="${project.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-sm service-record-showcase" data-id="${project.id}"><i class="fas fa-history"></i> Service Record</button>
        </div>
      </div>
      <div class="showcase-info">
        <h3>${escapeHtml(project.name)}</h3>
        <p><i class="fas fa-user"></i> ${escapeHtml(project.client) || '—'}</p>
        ${techBadges ? `<div class="showcase-tech">${techBadges}</div>` : ''}
        <span class="status ${(project.status || '').toLowerCase()}">${escapeHtml(project.status) || '—'}</span>
      </div>
    </div>
  `;
}

function parseTechStack(tech) {
  if (!tech) return [];
  if (Array.isArray(tech)) return tech;
  if (typeof tech === 'string') {
    try {
      const parsed = JSON.parse(tech);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return parsed.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    } catch {
      return tech.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
