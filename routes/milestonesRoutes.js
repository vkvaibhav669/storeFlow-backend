const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/milestones/:projectId
 * @description Get all milestones for a specific project
 * @access Private
 */
//router.get('/:projectId', protect, async (req, res) => {
  router.get('/:projectId',  async (req, res) => {
  try {
    const project = await StoreProject.findById(req.params.projectId, 'milestones');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.milestones);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/milestones/:projectId
 * @description Add a milestone to a specific project
 * @access Private
 */
//router.post('/:projectId', protect, async (req, res) => {
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

/**
 * @route PUT /api/milestones/:projectId/:milestoneId
 * @description Update a milestone by milestoneId in a specific project
 * @access Private
 */
//router.put('/:projectId/:milestoneId', protect, async (req, res) => {
  router.put('/:projectId/:milestoneId',  async (req, res) => {
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

/**
 * @route DELETE /api/milestones/:projectId/:milestoneId
 * @description Delete a milestone by milestoneId in a specific project
 * @access Private
 */
//router.delete('/:projectId/:milestoneId', protect, async (req, res) => {
  router.delete('/:projectId/:milestoneId',  async (req, res) => {
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