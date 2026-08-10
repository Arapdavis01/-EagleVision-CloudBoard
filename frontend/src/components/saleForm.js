export function renderSaleForm(projects) {
  const projectOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  return `
    <h2>Record Sale</h2>
    <form id="sale-form">
      <label>Project:
        <select name="project_id" required>
          <option value="">-- Select --</option>
          ${projectOptions}
        </select>
      </label>
      <label>Amount ($): <input type="number" name="amount" step="0.01" required></label>
      <label>Sale Date: <input type="date" name="sale_date" value="${new Date().toISOString().slice(0,10)}" required></label>
      <label>Notes: <textarea name="notes"></textarea></label>
      <button type="submit" class="btn">Record</button>
    </form>
  `;
}
