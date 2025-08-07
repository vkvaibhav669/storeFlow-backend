const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/projects/:projectId/milestones
 * @description Get all milestones for a specific project
 * @access Private
 */
router.get('/:projectId/milestones', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId, 'milestones');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.milestones);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/projects/:projectId/milestones
 * @description Add a milestone to a specific project
 * @access Private
 */
router.post('/:projectId/milestones', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const newMilestone = {
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      description: req.body.description || '',
      date: req.body.date ? new Date(req.body.date) : undefined,
      completed: req.body.completed || false
    };

    project.milestones.push(newMilestone);
    await project.save();
    res.status(201).json(newMilestone);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

/**
 * @route PUT /api/projects/:projectId/milestones/:milestoneId
 * @description Update a milestone by milestoneId in a specific project
 * @access Private
 */
router.put('/:projectId/milestones/:milestoneId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    Object.assign(milestone, req.body);
    await project.save();
    res.json(milestone);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

/**
 * @route DELETE /api/projects/:projectId/milestones/:milestoneId
 * @description Delete a milestone by milestoneId in a specific project
 * @access Private
 */
router.delete('/:projectId/milestones/:milestoneId', protect, async (req, res) => {
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

/**
 * @route GET /api/projects/:projectId/blockers
 * @description Get all blockers for a specific project
 * @access Private
 */
router.get('/:projectId/blockers', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId, 'blockers');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.blockers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/projects/:projectId/blockers
 * @description Add a blocker to a specific project
 * @access Private
 */
router.post('/:projectId/blockers', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const newBlocker = {
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      description: req.body.description || '',
      reportedById: req.body.reportedById,
      reportedBy: req.body.reportedBy,
      dateReported: req.body.dateReported ? new Date(req.body.dateReported) : new Date(),
      isResolved: req.body.isResolved || false,
      dateResolved: req.body.dateResolved ? new Date(req.body.dateResolved) : undefined
    };

    project.blockers.push(newBlocker);
    await project.save();
    res.status(201).json(newBlocker);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

/**
 * @route PUT /api/projects/:projectId/blockers/:blockerId
 * @description Update a blocker by blockerId in a specific project
 * @access Private
 */
router.put('/:projectId/blockers/:blockerId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const blocker = project.blockers.id(req.params.blockerId);
    if (!blocker) return res.status(404).json({ message: 'Blocker not found' });

    Object.assign(blocker, req.body);
    await project.save();
    res.json(blocker);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

/**
 * @route DELETE /api/projects/:projectId/blockers/:blockerId
 * @description Delete a blocker by blockerId in a specific project
 * @access Private
 */
router.delete('/:projectId/blockers/:blockerId', protect, async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const blocker = project.blockers.id(req.params.blockerId);
    if (!blocker) return res.status(404).json({ message: 'Blocker not found' });

    blocker.remove();
    await project.save();
    res.json({ message: 'Blocker deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;