const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/kpi', ctrl.kpi);
router.get('/reviews', ctrl.upcomingReviews);

module.exports = router;
