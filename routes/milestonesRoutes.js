const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

// GET all milestones for a project
router.get('/:projectId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId, 'milestones');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.milestones);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add a milestone to a project
router.post('/:projectId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.milestones.push(req.body);
    await project.save();
    res.status(201).json(project.milestones[project.milestones.length - 1]);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// PUT update a milestone by milestoneId in a project
router.put('/:projectId/:milestoneId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    Object.assign(milestone, req.body);
    await project.save();
    res.json(milestone);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// DELETE a milestone by milestoneId in a project
router.delete('/:projectId/:milestoneId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.remove();
    await project.save();
    res.json({ message: 'Milestone deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;