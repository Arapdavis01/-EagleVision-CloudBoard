export function formatCurrency(amount) {
  return '$' + Number(amount).toLocaleString();
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}
