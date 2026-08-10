const router = require('express').Router();
const ctrl = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', ctrl.login);
router.post('/logout', authMiddleware, ctrl.logout);
router.get('/session', authMiddleware, ctrl.checkSession);

module.exports = router;
