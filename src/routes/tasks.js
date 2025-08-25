const { Router } = require('express');
const UnifiedTask = require('../models/Task');
const authorize = require('../middleware/authorize');
const router = Router();

router.get('/stores/:storeId/projects/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params;
  const tasks = await UnifiedTask.find({ projectId, deletedAt: { $exists: false } });
  res.json({ data: tasks });
});

router.post('/stores/:storeId/projects/:projectId/tasks',
  authorize((perms) => perms.has('project:manage')),
  async (req, res) => {
    const { projectId } = req.params;
    const task = await UnifiedTask.create({ ...req.body, projectId });
    res.status(201).json({ data: task });
  });

router.get('/stores/:storeId/projects/:projectId/tasks/:taskId', async (req, res) => {
  const task = await UnifiedTask.findById(req.params.taskId);
  if (!task || task.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
  res.json({ data: task });
});

router.patch('/stores/:storeId/projects/:projectId/tasks/:taskId',
  authorize((perms) => perms.has('project:manage')),
  async (req, res) => {
    const task = await UnifiedTask.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
    res.json({ data: task });
  });

module.exports = router;