export function renderUpcomingReviews(reviews) {
  if (!reviews.length) return '<p>No upcoming reviews.</p>';
  return `
    <ul>
      ${reviews.map(r => `<li>${r.name} (${r.client}) – Review: ${new Date(r.next_review_date).toLocaleDateString()}</li>`).join('')}
    </ul>
  `;
}
