const cron = require('node-cron');
const { checkAllProjects } = require('../services/uptimeService');

function startUptimeCron() {
  // runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running uptime check...');
    await checkAllProjects();
  });
  console.log('Uptime cron job started.');
}

module.exports = { startUptimeCron };
