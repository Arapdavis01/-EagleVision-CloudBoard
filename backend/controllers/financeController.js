const pool = require('../config/db');

// ==================== REVENUE (SALES) ====================

// Get all sales with project name
exports.getAllRevenue = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.project_id, s.amount, s.sale_date, s.notes, p.name as project_name
       FROM sales_records s
       JOIN projects p ON s.project_id = p.id
       ORDER BY s.sale_date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
};

// Create a sale record
exports.createRevenue = async (req, res) => {
  const { project_id, amount, sale_date, notes } = req.body;
  if (!project_id || !amount) {
    return res.status(400).json({ error: 'Project and amount are required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO sales_records (project_id, amount, sale_date, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [project_id, amount, sale_date || new Date().toISOString().slice(0,10), notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create sale' });
  }
};

// Update a sale record
exports.updateRevenue = async (req, res) => {
  const { id } = req.params;
  const { project_id, amount, sale_date, notes } = req.body;
  if (!project_id || !amount) {
    return res.status(400).json({ error: 'Project and amount are required' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE sales_records SET project_id = $1, amount = $2, sale_date = $3, notes = $4
       WHERE id = $5 RETURNING *`,
      [project_id, amount, sale_date, notes || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update sale' });
  }
};

// Delete a sale record
exports.deleteRevenue = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM sales_records WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Sale not found' });
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};

// Revenue summary (total, this month, average, count)
exports.getRevenueSummary = async (req, res) => {
  try {
    const [totalResult, monthResult] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count FROM sales_records'),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM sales_records
                 WHERE TO_CHAR(sale_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')`)
    ]);
    const totalRevenue = parseFloat(totalResult.rows[0].total);
    const count = parseInt(totalResult.rows[0].count);
    const monthRevenue = parseFloat(monthResult.rows[0].total);
    const averageRevenue = count > 0 ? totalRevenue / count : 0;
    res.json({
      total_revenue: totalRevenue,
      month_revenue: monthRevenue,
      average_revenue: averageRevenue,
      sales_count: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
};

// ==================== EXPENSES ====================

// Get all expenses with optional project name
exports.getAllExpenses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.project_id, e.category, e.amount, e.expense_date,
              e.vendor, e.payment_method, e.reference, e.notes, e.created_at,
              p.name as project_name
       FROM expenses e
       LEFT JOIN projects p ON e.project_id = p.id
       ORDER BY e.expense_date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// Get expenses for a specific project
exports.getProjectExpenses = async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, project_id, category, amount, expense_date,
              vendor, payment_method, reference, notes, created_at
       FROM expenses
       WHERE project_id = $1
       ORDER BY expense_date DESC`,
      [projectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project expenses' });
  }
};

// Create an expense
exports.createExpense = async (req, res) => {
  const {
    project_id, category, amount, expense_date,
    vendor, payment_method, reference, notes
  } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: 'Category and amount are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO expenses
       (project_id, category, amount, expense_date, vendor, payment_method, reference, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        project_id || null,
        category,
        amount,
        expense_date || new Date().toISOString().slice(0,10),
        vendor || null,
        payment_method || null,
        reference || null,
        notes || null
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const {
    project_id, category, amount, expense_date,
    vendor, payment_method, reference, notes
  } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: 'Category and amount are required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE expenses SET
       project_id = $1, category = $2, amount = $3, expense_date = $4,
       vendor = $5, payment_method = $6, reference = $7, notes = $8
       WHERE id = $9
       RETURNING *`,
      [
        project_id || null,
        category,
        amount,
        expense_date || new Date().toISOString().slice(0,10),
        vendor || null,
        payment_method || null,
        reference || null,
        notes || null,
        id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// Expense summary (total, this month, average, count)
exports.getExpenseSummary = async (req, res) => {
  try {
    const [totalResult, monthResult] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count FROM expenses'),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses
                 WHERE TO_CHAR(expense_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')`)
    ]);
    const totalExpense = parseFloat(totalResult.rows[0].total);
    const count = parseInt(totalResult.rows[0].count);
    const monthExpense = parseFloat(monthResult.rows[0].total);
    const averageExpense = count > 0 ? totalExpense / count : 0;
    res.json({
      total_expense: totalExpense,
      month_expense: monthExpense,
      average_expense: averageExpense,
      expense_count: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
};

// ==================== NET INCOME ====================

// Calculate net income (revenue - expenses) and totals
exports.getNetIncome = async (req, res) => {
  try {
    const [revenueResult, expenseResult] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM sales_records'),
      pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses')
    ]);
    const totalRevenue = parseFloat(revenueResult.rows[0].total);
    const totalExpense = parseFloat(expenseResult.rows[0].total);
    const netIncome = totalRevenue - totalExpense;
    res.json({
      net_income: netIncome,
      total_revenue: totalRevenue,
      total_expense: totalExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate net income' });
  }
};
