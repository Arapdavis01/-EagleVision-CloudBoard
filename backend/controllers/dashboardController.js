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
       AND next_review_date >= CURRENT_DATE
     ORDER BY next_review_date ASC
     LIMIT 10`
  );
  res.json(rows);
};

// 1. Status Distribution (for doughnut chart)
exports.statusDistribution = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*) as count
     FROM projects
     GROUP BY status
     ORDER BY count DESC`
  );
  res.json(rows);
};

// 2. Pending Revenue (sum of asking_price for projects marked for_sale)
exports.pendingRevenue = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(asking_price),0) as total_pending
     FROM projects
     WHERE for_sale = true`
  );
  res.json({ total_pending: parseFloat(rows[0].total_pending) });
};

// 3. Overdue Reviews (next_review_date in the past)
exports.overdueReviews = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, client, next_review_date, status
     FROM projects
     WHERE next_review_date IS NOT NULL
       AND next_review_date < CURRENT_DATE
     ORDER BY next_review_date ASC
     LIMIT 5`
  );
  res.json(rows);
};

// 4. County Breakdown (top locations with project count)
exports.countyBreakdown = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT location, COUNT(*) as project_count
     FROM projects
     WHERE location IS NOT NULL AND location != ''
     GROUP BY location
     ORDER BY project_count DESC
     LIMIT 5`
  );
  res.json(rows);
};

// 5. Projects marked for sale (for dashboard)
exports.forSaleProjects = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, client, asking_price, status
     FROM projects
     WHERE for_sale = true
     ORDER BY asking_price DESC NULLS LAST
     LIMIT 5`
  );
  res.json(rows);
};
