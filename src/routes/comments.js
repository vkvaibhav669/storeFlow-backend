const { Router } = require('express');
const ctrl = require('../controllers/comments.controller');
const authorize = require('../middleware/authorize');

const router = Router();

// Generic polymorphic
router.get('/', ctrl.list);
router.post('/', authorize((perms) => perms.has('project:manage') || perms.has('project:read') || perms.has('store:manage')), ctrl.create);

// Nested convenience for tasks
router.get('/stores/:storeId/projects/:projectId/tasks/:subjectId/comments', ctrl.list);
router.post('/stores/:storeId/projects/:projectId/tasks/:subjectId/comments', ctrl.create);

// Replies
router.post('/:commentId/replies', ctrl.create);

module.exports = router;