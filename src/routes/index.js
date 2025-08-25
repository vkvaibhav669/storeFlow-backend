const { Router } = require('express');
const auth = require('../middleware/auth');
const context = require('../middleware/context');

const users = require('./users');
const stores = require('./stores');
const projects = require('./projects');
const tasks = require('./tasks');
const milestones = require('./milestones');
const blockers = require('./blockers');
const comments = require('./comments');
const approvals = require('./approvals');
const files = require('./files');

const router = Router();

router.use('/auth', require('./auth'));

// Protected routes
router.use(auth, context);

router.use('/users', users);
router.use('/stores', stores);
router.use('/projects', projects);
router.use('/tasks', tasks);
router.use('/milestones', milestones);
router.use('/blockers', blockers);
router.use('/comments', comments);
router.use('/approvals', approvals);
router.use('/files', files);

module.exports = router;