const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');

// Add a new task to a project
/**
 * @route GET /api/tasks/:projectId
 * @description Add a new task to a specific project
 * @access Private
 * Example: /api/tasks/filter?projectId=123&department=Sales&priority=High
 */
//router.post('/:projectId', protect, async (req, res) => {
  router.post('/:projectId', async (req, res) => {
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


/**
 * @route GET /api/tasks/:projectId
 * @description Get tasks for a specific project
 * @param {String} projectId - The ID of the project to fetch tasks from
 * @access Private
 * Example: /api/tasks/filter?projectId=123&department=Sales&priority=High
 */
//router.get('/:projectId', protect, async (req, res) => {
  router.get('/:projectId',  async (req, res) => {
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

/**
 * @route GET /api/tasks/filter
 * @description Get tasks filtered by project, department, or priority
 * @access Private
 * Example: /api/tasks/filter?projectId=123&department=Sales&priority=High
 */
//router.get('/filter', protect, async (req, res) => {
  router.get('/filter', async (req, res) => {
  try {
    const { projectId, department, priority } = req.query;

    // Build the filter object for tasks
    const taskFilter = {};
    if (department) taskFilter.department = department;
    if (priority) taskFilter.priority = priority;

    // Build the filter for projects
    const projectQuery = {};
    if (projectId) projectQuery._id = projectId;

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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;