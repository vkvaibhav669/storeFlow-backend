const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

/**
 * @route POST /api/projects/:projectId/tasks/:taskId/comments
 * @description Add a comment to a specific task of a project
 * @access Private
 */
router.post('/:projectId/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const commentData = req.body;

    // Find the project
    const project = await StoreProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the task within the project
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Add the comment to the task's comments array
    if (!task.comments) task.comments = [];
    task.comments.push(commentData);

    await project.save();

    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/projects/:projectId/tasks/:taskId/comments
 * @description Get all comments for a specific task of a project
 * @access Private
 */
router.get('/:projectId/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Find the project
    const project = await StoreProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the task within the project
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Return the comments array (empty array if none)
    res.status(200).json(task.comments || []);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;