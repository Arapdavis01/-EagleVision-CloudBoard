const pool = require('../config/db');
const axios = require('axios');  // will add axios to dependencies later

async function checkUptimeForProject(project) {
  const start = Date.now();
  try {
    const response = await axios.get(project.live_url, {
      timeout: 10000,
      validateStatus: () => true  // don't throw on non-2xx
    });
    const responseTime = Date.now() - start;
    return {
      project_id: project.id,
      response_time_ms: responseTime,
      status_code: response.status,
      is_up: response.status >= 200 && response.status < 400
    };
  } catch (err) {
    const responseTime = Date.now() - start;
    return {
      project_id: project.id,
      response_time_ms: responseTime,
      status_code: null,
      is_up: false
    };
  }
}

async function checkAllProjects() {
  const { rows: projects } = await pool.query(
    `SELECT id, live_url FROM projects
     WHERE live_url IS NOT NULL AND live_url != ''
       AND status IN ('Live', 'Maintenance')`
  );

  for (const project of projects) {
    try {
      const result = await checkUptimeForProject(project);
      await pool.query(
        `INSERT INTO uptime_logs (project_id, response_time_ms, status_code, is_up)
         VALUES ($1, $2, $3, $4)`,
        [result.project_id, result.response_time_ms, result.status_code, result.is_up]
      );
    } catch (insertErr) {
      console.error(`Failed to log uptime for project ${project.id}:`, insertErr.message);
    }
  }
  console.log(`Uptime check completed for ${projects.length} projects.`);
}

module.exports = { checkAllProjects };
