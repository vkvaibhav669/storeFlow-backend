const { Router } = require('express');
const UnifiedFile = require('../models/File');
const authorize = require('../middleware/authorize');
const router = Router();

// Polymorphic listing/creation
router.get('/', async (req, res) => {
  const { subjectType, subjectId } = req.query;
  const filter = { deletedAt: { $exists: false } };
  if (subjectType && subjectId) {
    filter.subjectModel = normalize(req.query.subjectType);
    filter.subjectId = req.query.subjectId;
  }
  const items = await UnifiedFile.find(filter).sort({ createdAt: -1 });
  res.json({ data: items });
});

router.post('/', authorize((perms) => perms.has('project:manage') || perms.has('store:manage')), async (req, res) => {
  const item = await UnifiedFile.create({
    subjectModel: normalize(req.body.subjectType),
    subjectId: req.body.subjectId,
    name: req.body.name,
    versions: req.body.versions || [],
  });
  res.status(201).json({ data: item });
});

function normalize(s) {
  const map = { store: 'UnifiedStore', project: 'UnifiedProject', task: 'UnifiedTask', milestone: 'UnifiedMilestone', blocker: 'UnifiedBlocker', approval: 'UnifiedApprovalRequest' };
  return map[String(s || '').toLowerCase()] || s;
}

module.exports = router;