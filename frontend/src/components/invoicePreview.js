export function renderInvoicePreview(sale) {
  return `
    <div id="invoice-print">
      <h2>Invoice</h2>
      <p>Project: ${sale.project_name}</p>
      <p>Amount: $${sale.amount}</p>
      <p>Date: ${sale.sale_date}</p>
      <p>Notes: ${sale.notes || ''}</p>
      <button onclick="window.print()" class="btn">Print</button>
    </div>
  `;
}
