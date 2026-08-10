export function renderUpcomingReviews(reviews) {
  if (!reviews || reviews.length === 0) return '';

  const now = new Date();
  now.setHours(0,0,0,0);

  const items = reviews.map(r => {
    const reviewDate = new Date(r.next_review_date);
    reviewDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));

    let badge = '';
    let badgeClass = '';
    if (diffDays < 0) {
      badge = 'Overdue';
      badgeClass = 'badge-overdue';
    } else if (diffDays <= 7) {
      badge = 'Due Soon';
      badgeClass = 'badge-due-soon';
    } else {
      badge = 'Upcoming';
      badgeClass = 'badge-upcoming';
    }

    return `
      <li class="review-item">
        <div>
          <strong>${escapeHtml(r.name)}</strong>
          <span class="review-client"> – ${escapeHtml(r.client) || 'No client'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="review-date">${reviewDate.toLocaleDateString()}</span>
          <span class="badge ${badgeClass}">${badge}</span>
        </div>
      </li>
    `;
  }).join('');

  return `
    <div class="card" style="margin-bottom: 2rem;">
      <h3 style="margin-bottom: 1rem;"><i class="fas fa-calendar-alt"></i> Upcoming & Overdue Reviews</h3>
      <ul class="recent-list">
        ${items}
      </ul>
    </div>
  `;
}

function escapeHtml(text) {
  return text ? text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
}
