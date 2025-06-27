const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

// Add a new task to a project
router.post('/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const taskData = req.body;

    const project = await StoreProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.tasks.push(taskData);
    await project.save();

    res.status(201).json(project.tasks[project.tasks.length - 1]);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks from a project
router.get('/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await StoreProject.findById(projectId, 'tasks');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project.tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;