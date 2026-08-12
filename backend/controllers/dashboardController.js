const pool = require('../config/db');

exports.kpi = async (req, res) => {
  const [totalProjects, overdueCount, activeClients, revenue] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM projects'),
    pool.query("SELECT COUNT(*) FROM projects WHERE next_review_date IS NOT NULL AND next_review_date < CURRENT_DATE"),
    pool.query('SELECT COUNT(DISTINCT client) FROM projects WHERE client IS NOT NULL AND client != \'\''),
    pool.query('SELECT COALESCE(SUM(amount),0) as total FROM sales_records')
  ]);
  res.json({
    total_projects: parseInt(totalProjects.rows[0].count),
    overdue_reviews: parseInt(overdueCount.rows[0].count),
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

// 6. Projects summary (all projects with essential fields)
exports.getProjectsSummary = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, client, status, location
     FROM projects
     ORDER BY name ASC`
  );
  res.json(rows);
};

// 7. Clients summary (distinct clients with project count and active flag)
exports.getClientsSummary = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT client, COUNT(*) as project_count,
            bool_or(status IN ('Live','Development')) as is_active
     FROM projects
     WHERE client IS NOT NULL AND client != ''
     GROUP BY client
     ORDER BY project_count DESC`
  );
  res.json(rows);
};

// 8. Revenue summary (all sales with project name)
exports.getRevenueSummary = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.amount, s.sale_date, s.notes, p.name as project_name
     FROM sales_records s
     JOIN projects p ON s.project_id = p.id
     ORDER BY s.sale_date DESC`
  );
  res.json(rows);
};

// 9. Get admin preferences (exchange rate)
exports.getPreferences = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT preferences FROM admin_preferences WHERE admin_id = $1',
    [req.adminId]
  );
  if (rows.length === 0) {
    return res.json({ exchange_rate: 129 });
  }
  const prefs = rows[0].preferences;
  res.json({ exchange_rate: prefs.exchange_rate || 129 });
};

// 10. Update admin preferences
exports.updatePreferences = async (req, res) => {
  const { exchange_rate } = req.body;
  const newRate = parseFloat(exchange_rate);
  if (!newRate || newRate <= 0) {
    return res.status(400).json({ error: 'Invalid exchange rate' });
  }

  await pool.query(
    `INSERT INTO admin_preferences (admin_id, preferences)
     VALUES ($1, $2)
     ON CONFLICT (admin_id) DO UPDATE SET preferences = EXCLUDED.preferences`,
    [req.adminId, JSON.stringify({ exchange_rate: newRate })]
  );
  res.json({ exchange_rate: newRate });
};
