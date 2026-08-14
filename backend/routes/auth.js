const router = require('express').Router();
const ctrl = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Email/password login
router.post('/login', ctrl.login);

// QR code login
router.post('/qr/session', ctrl.generateLoginSession);                 // start QR session (public)
router.get('/qr/session/:token/status', ctrl.checkLoginSessionStatus); // laptop polls this (public)
router.post('/qr/session/:token/approve', ctrl.approveLoginSession);   // phone approves with PIN (public, no auth)

// Standard logout & session check
router.post('/logout', authMiddleware, ctrl.logout);
router.get('/session', authMiddleware, ctrl.checkSession);

module.exports = router;
