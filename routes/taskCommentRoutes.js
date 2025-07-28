const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

// Add a comment to a specific task of a project
// Original: router.post('/:projectId/tasks/:taskId/comments', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.post('/:projectId/tasks/:taskId/comments', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { text, addedById, addedByName } = req.body;

    // Validate required fields
    if (!text || !addedById || !addedByName) {
      return res.status(400).json({ 
        message: 'Missing required fields: text, addedById, and addedByName are required' 
      });
    }

    // Validate ObjectId format for projectId, taskId, and addedById
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(addedById)) {
      return res.status(400).json({ message: 'Invalid addedById format' });
    }

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

    // Create new comment with properly formatted data
    const newComment = {
      text: text.trim(),
      addedById: addedById,
      addedByName: addedByName.trim(),
      addedAt: new Date(),
      replies: []
    };

    // Add the comment to the task's comments array
    if (!task.comments) task.comments = [];
    task.comments.push(newComment);

    await project.save();

    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format: ' + error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all comments for a specific task of a project
// Original: router.get('/:projectId/tasks/:taskId/comments', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/:projectId/tasks/:taskId/comments', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Validate ObjectId format for projectId and taskId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

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
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;