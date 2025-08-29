const express = require('express');
const router = express.Router();
const approvalsController = require('../controllers/approvalsController');
const auth = require('../middleware/auth');

router.post('/', auth, approvalsController.createApproval);
router.get('/', auth, approvalsController.listApprovals);
router.get('/:id', auth, approvalsController.getApproval);
router.put('/:id', auth, approvalsController.updateApproval);
router.put('/:id/decision', auth, approvalsController.decideApproval);
router.delete('/:id', auth, approvalsController.deleteApproval);

module.exports = router;
