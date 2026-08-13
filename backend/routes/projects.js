const router = require('express').Router();
const ctrl = require('../controllers/projectController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

// Basic project CRUD
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);

// Project updates (Service Record)
router.get('/:projectId/updates', ctrl.getProjectUpdates);
router.post('/:projectId/updates', ctrl.createProjectUpdate);
router.put('/updates/:id', ctrl.updateProjectUpdate);
router.delete('/updates/:id', ctrl.deleteProjectUpdate);

// Project single item operations
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
