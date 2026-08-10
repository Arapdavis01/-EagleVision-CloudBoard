const pool = require('../config/db');

exports.getLogs = async (req, res) => {
  const { project_id } = req.query;
  let query = `SELECT l.*, p.name as project_name FROM uptime_logs l
               JOIN projects p ON l.project_id = p.id`;
  const params = [];
  if (project_id) {
    query += ' WHERE l.project_id = $1';
    params.push(project_id);
  }
  query += ' ORDER BY l.checked_at DESC LIMIT 100';
  const { rows } = await pool.query(query, params);
  res.json(rows);
};

exports.getAlerts = async (req, res) => {
  // Projects that are currently down based on the latest uptime check
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (p.id) p.id, p.name, p.live_url, p.status,
            l.is_up, l.checked_at, l.status_code
     FROM projects p
     JOIN uptime_logs l ON p.id = l.project_id
     WHERE l.checked_at = (
       SELECT MAX(checked_at) FROM uptime_logs WHERE project_id = p.id
     )
     AND l.is_up = false
     ORDER BY p.id, l.checked_at DESC`
  );
  res.json(rows);
};

exports.resolveAlert = async (req, res) => {
  const { id } = req.params; // project id
  // For now, just acknowledge by logging that it was resolved manually.
  // No actual status change, but you can add a resolved flag if needed.
  res.json({ message: `Alert for project ${id} acknowledged` });
};
