const { Router } = require('express');
const UnifiedProject = require('../models/Project');
const authorize = require('../middleware/authorize');
const router = Router();

router.get('/stores/:storeId/projects', async (req, res) => {
  const projects = await UnifiedProject.find({ storeId: req.params.storeId, deletedAt: { $exists: false } });
  res.json({ data: projects });
});

router.post('/stores/:storeId/projects', authorize((perms) => perms.has('store:manage')), async (req, res) => {
  const project = await UnifiedProject.create({ ...req.body, storeId: req.params.storeId, createdBy: req.user._id });
  res.status(201).json({ data: project });
});

router.get('/stores/:storeId/projects/:projectId', async (req, res) => {
  const project = await UnifiedProject.findById(req.params.projectId);
  if (!project || project.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  res.json({ data: project });
});

router.patch('/stores/:storeId/projects/:projectId', authorize((perms) => perms.has('project:manage') || perms.has('store:manage')), async (req, res) => {
  const project = await UnifiedProject.findByIdAndUpdate(req.params.projectId, req.body, { new: true });
  res.json({ data: project });
});

module.exports = router;