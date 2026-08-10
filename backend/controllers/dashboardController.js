const pool = require('../config/db');

exports.kpi = async (req, res) => {
  const [totalProjects, liveProjects, activeClients, revenue] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM projects'),
    pool.query("SELECT COUNT(*) FROM projects WHERE status = 'Live'"),
    pool.query('SELECT COUNT(DISTINCT client) FROM projects WHERE client IS NOT NULL AND client != \'\''),
    pool.query('SELECT COALESCE(SUM(amount),0) as total FROM sales_records')
  ]);
  res.json({
    total_projects: parseInt(totalProjects.rows[0].count),
    live_projects: parseInt(liveProjects.rows[0].count),
    active_clients: parseInt(activeClients.rows[0].count),
    total_revenue: parseFloat(revenue.rows[0].total)
  });
};

exports.upcomingReviews = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, client, next_review_date, status
     FROM projects
     WHERE next_review_date IS NOT NULL
       AND next_review_date <= CURRENT_DATE + INTERVAL '30 days'
     ORDER BY next_review_date ASC
     LIMIT 10`
  );
  res.json(rows);
};
