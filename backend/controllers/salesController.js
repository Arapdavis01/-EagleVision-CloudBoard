const pool = require('../config/db');

exports.getAll = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, p.name as project_name
     FROM sales_records s
     JOIN projects p ON s.project_id = p.id
     ORDER BY s.sale_date DESC`
  );
  res.json(rows);
};

exports.create = async (req, res) => {
  const { project_id, amount, sale_date, notes } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO sales_records (project_id, amount, sale_date, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [project_id, amount, sale_date, notes]
  );
  res.status(201).json(rows[0]);
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM sales_records WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Sale not found' });
  res.json({ message: 'Sale deleted' });
};
