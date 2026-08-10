const router = require('express').Router();
const ctrl = require('../controllers/salesController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
