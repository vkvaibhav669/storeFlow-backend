const { Router } = require('express');
const ctrl = require('../controllers/approvals.controller');
const authorize = require('../middleware/authorize');

const router = Router();

router.get('/', ctrl.list);
router.post('/', authorize((perms) => perms.has('project:manage') || perms.has('store:manage')), ctrl.create);
router.post('/:approvalId/decisions', authorize(() => true), ctrl.decide);

module.exports = router;