const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/kpi', ctrl.kpi);
router.get('/reviews', ctrl.upcomingReviews);
router.get('/status-distribution', ctrl.statusDistribution);
router.get('/pending-revenue', ctrl.pendingRevenue);
router.get('/overdue-reviews', ctrl.overdueReviews);
router.get('/county-breakdown', ctrl.countyBreakdown);
router.get('/for-sale', ctrl.forSaleProjects);
router.get('/projects-summary', ctrl.getProjectsSummary);
router.get('/clients-summary', ctrl.getClientsSummary);
router.get('/revenue-summary', ctrl.getRevenueSummary);

module.exports = router;
