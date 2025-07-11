const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject'); // Import StoreProject model
const { protect, authorize } = require('../middleware/auth');

/**
 * @route POST /api/projects/:projectId/tasks/:taskId/comments/:commentId/replies
 * @description Add a reply to a comment on a specific task of a project
 * @access Private
 */
router.post('/:projectId/tasks/:taskId/comments/:commentId/replies', protect, async (req, res) => {
  try {
    const { projectId, taskId, commentId } = req.params;
    const replyData = req.body;

    // Find the project and task
    const project = await StoreProject.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = project.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Find the parent comment (recursive search)
    function findComment(comments, id) {
      for (let comment of comments) {
        if (comment._id.toString() === id) return comment;
        const found = findComment(comment.replies || [], id);
        if (found) return found;
      }
      return null;
    }
    const parentComment = findComment(task.comments, commentId);
    if (!parentComment) return res.status(404).json({ message: 'Comment not found' });

    // Add the reply
    parentComment.replies.push(replyData);
    await project.save();

    res.status(201).json(parentComment.replies[parentComment.replies.length - 1]);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;