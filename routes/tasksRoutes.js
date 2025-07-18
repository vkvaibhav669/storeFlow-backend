const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

// Add a new task to a project
/**
 * @route POST /api/tasks/:projectId
 * @description Add a new task to a specific project
 * @access Private
 * Example: /api/tasks/filter?projectId=123&department=Sales&priority=High
 */
// Original: router.post('/:projectId', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const taskData = req.body;

    // Validate the projectId parameter
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await StoreProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.tasks.push(taskData);
    await project.save();

    res.status(201).json(project.tasks[project.tasks.length - 1]);
  } catch (error) {
    console.error('Error adding task:', error);
    // More specific error handling for invalid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route GET /api/tasks/:projectId
 * @description Get tasks for a specific project
 * @param {String} projectId - The ID of the project to fetch tasks from
 * @access Private
 * Example: /api/tasks/filter?projectId=123&department=Sales&priority=High
 */
// Original: router.get('/:projectId', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate the projectId parameter
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await StoreProject.findById(projectId, 'tasks');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project.tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // More specific error handling for invalid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/tasks/filter
 * @description Get tasks filtered by project, department, or priority
 * @access Private
 * Example: /api/tasks/filter?projectId=123&department=Sales&priority=High
 */
// Original: router.get('/filter', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/filter', async (req, res) => {
  try {
    const { projectId, department, priority } = req.query;

    // Build the filter object for tasks
    const taskFilter = {};
    if (department) taskFilter.department = department;
    if (priority) taskFilter.priority = priority;

    // Build the filter for projects
    const projectQuery = {};
    if (projectId) {
      // Validate ObjectId format if projectId is provided
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID format' });
      }
      projectQuery._id = projectId;
    }

    // Find projects matching projectId (if provided)
    const projects = await StoreProject.find(projectQuery);

    // Collect and filter tasks from all matching projects
    let filteredTasks = [];
    projects.forEach(project => {
      const tasks = project.tasks.filter(task => {
        let match = true;
        if (department) match = match && task.department === department;
        if (priority) match = match && task.priority === priority;
        return match;
      });
      filteredTasks = filteredTasks.concat(tasks);
    });

    res.status(200).json(filteredTasks);
  } catch (error) {
    console.error('Error filtering tasks:', error);
    // More specific error handling for invalid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/tasks/:projectId/:taskId
 * @description Update a specific task within a project
 * @access Private
 * @param {String} projectId - The ID of the project containing the task
 * @param {String} taskId - The ID of the task to update
 * Example: PUT /api/tasks/123/456 with task update data in request body
 */
// Original: router.put('/:projectId/:taskId', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.put('/:projectId/:taskId', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const updateData = req.body;

    // Validate the projectId parameter
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }

    // Validate the taskId parameter
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      return res.status(400).json({ message: 'Invalid task ID provided' });
    }
    
    // Validate ObjectId format for both IDs
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

    // Find the specific task within the project
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task fields with provided data
    // Only update fields that are provided in the request body
    const allowedFields = [
      'name', 'department', 'status', 'priority', 
      'assignedToId', 'assignedToName', 'dueDate', 'description'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    // Save the updated project
    await project.save();

    res.status(200).json({
      message: 'Task updated successfully',
      task: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    // More specific error handling for invalid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;