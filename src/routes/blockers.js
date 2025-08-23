const { Router } = require('express');
const UnifiedBlocker = require('../models/Blocker');
const authorize = require('../middleware/authorize');
const router = Router();

router.get('/stores/:storeId/projects/:projectId/blockers', async (req, res) => {
  const items = await UnifiedBlocker.find({ projectId: req.params.projectId, deletedAt: { $exists: false } });
  res.json({ data: items });
});

router.post('/stores/:storeId/projects/:projectId/blockers', authorize((perms) => perms.has('project:manage')),
  async (req, res) => {
    const item = await UnifiedBlocker.create({ ...req.body, projectId: req.params.projectId });
    res.status(201).json({ data: item });
  });

router.get('/stores/:storeId/projects/:projectId/blockers/:blockerId', async (req, res) => {
  const item = await UnifiedBlocker.findById(req.params.blockerId);
  if (!item || item.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Blocker not found' } });
  res.json({ data: item });
});

router.patch('/stores/:storeId/projects/:projectId/blockers/:blockerId', authorize((perms) => perms.has('project:manage')),
  async (req, res) => {
    const item = await UnifiedBlocker.findByIdAndUpdate(req.params.blockerId, req.body, { new: true });
    res.json({ data: item });
  });

module.exports = router;