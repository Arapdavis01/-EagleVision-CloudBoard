export function renderSaleForm() {
  return `
    <h2>Record Sale</h2>
    <form id="sale-form">
      <label>Project:
        <select name="project_id" required>
          <!-- options populated dynamically -->
        </select>
      </label>
      <label>Amount ($): <input type="number" name="amount" step="0.01" required></label>
      <label>Sale Date: <input type="date" name="sale_date" required></label>
      <label>Notes: <textarea name="notes"></textarea></label>
      <button type="submit" class="btn">Record</button>
    </form>
  `;
}
