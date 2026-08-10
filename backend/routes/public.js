const router = require('express').Router();
const ctrl = require('../controllers/projectController');

router.get('/status/:token', ctrl.getPublicStatus);

module.exports = router;
