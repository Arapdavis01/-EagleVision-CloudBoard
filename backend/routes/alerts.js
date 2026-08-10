const router = require('express').Router();
const ctrl = require('../controllers/uptimeController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', ctrl.getAlerts);
router.post('/:id/resolve', ctrl.resolveAlert);

module.exports = router;
