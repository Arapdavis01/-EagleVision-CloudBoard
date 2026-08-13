export function renderShowcaseCard(project) {
  const thumbnailUrl = project.thumbnail_url || '';
  const imageHtml = thumbnailUrl
    ? `<img class="showcase-thumbnail" src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(project.name)}" loading="lazy" />`
    : `<div class="showcase-placeholder"><i class="fas fa-image"></i></div>`;

  return `
    <div class="showcase-card" data-id="${project.id}">
      ${imageHtml}
      <div class="showcase-info">
        <h3>${escapeHtml(project.name)}</h3>
        <p><i class="fas fa-user"></i> ${escapeHtml(project.client) || '—'}</p>
        <span class="status ${(project.status || '').toLowerCase()}">${escapeHtml(project.status) || '—'}</span>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
