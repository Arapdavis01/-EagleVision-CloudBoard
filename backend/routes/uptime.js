const router = require('express').Router();
const ctrl = require('../controllers/uptimeController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/logs', ctrl.getLogs);

module.exports = router;
