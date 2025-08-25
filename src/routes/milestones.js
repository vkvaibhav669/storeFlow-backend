const { Router } = require('express');
const UnifiedMilestone = require('../models/Milestone');
const authorize = require('../middleware/authorize');
const router = Router();

router.get('/stores/:storeId/projects/:projectId/milestones', async (req, res) => {
  const items = await UnifiedMilestone.find({ projectId: req.params.projectId, deletedAt: { $exists: false } });
  res.json({ data: items });
});

router.post('/stores/:storeId/projects/:projectId/milestones', authorize((perms) => perms.has('project:manage')),
  async (req, res) => {
    const item = await UnifiedMilestone.create({ ...req.body, projectId: req.params.projectId });
    res.status(201).json({ data: item });
  });

router.get('/stores/:storeId/projects/:projectId/milestones/:milestoneId', async (req, res) => {
  const item = await UnifiedMilestone.findById(req.params.milestoneId);
  if (!item || item.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
  res.json({ data: item });
});

router.patch('/stores/:storeId/projects/:projectId/milestones/:milestoneId', authorize((perms) => perms.has('project:manage')),
  async (req, res) => {
    const item = await UnifiedMilestone.findByIdAndUpdate(req.params.milestoneId, req.body, { new: true });
    res.json({ data: item });
  });

module.exports = router;