const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StoreProject = require('../models/StoreProject');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Task = require('../models/Task'); // optional top-level collection



/////////////////





////////////////


// Helper: validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

/**
 * Side effects after assigning a task:
 * - create Notification document
 * - update User.assignedTasks and push notification id
 * - emit socket event to the user's room (if io attached on app)
 * - enqueue email job (if emailQueue attached on app)
 */
async function postAssignSideEffects(app, userId, project, task) {
  const notif = new Notification({
    userId,
    title: `New task assigned: ${task.name}`,
    message: `You have been assigned a task in project "${project.name}"`,
    link: `/projects/${project._id}/tasks/${task._id}`,
    data: { projectId: project._id, taskId: task._id }
  });
  await notif.save();

  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        assignedTasks: {
          projectId: project._id,
          taskId: task._id,
          name: task.name,
          assignedAt: new Date(),
          status: task.status || 'todo'
        },
        notifications: notif._id
      }
    });
  } catch (err) {
    // Log and continue. This should not break the main operation.
    console.error('Failed updating user assignedTasks/notifications:', err);
  }

  // Socket emit (if socket.io is configured and stored on app)
  const io = app.get('io');
  if (io) {
    try {
      io.to(String(userId)).emit('notification', {
        id: notif._id,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        createdAt: notif.createdAt
      });
    } catch (err) {
      console.warn('Socket emit failed:', err);
    }
  }

  // Enqueue email job (if Bull queue is configured and stored on app)
  const emailQueue = app.get('emailQueue');
  if (emailQueue) {
    try {
      const user = await User.findById(userId).select('email');
      await emailQueue.add('send-assignment-email', {
        toUserId: userId,
        toEmail: user ? user.email : null,
        subject: `New task assigned: ${task.name}`,
        text: `You have been assigned a task "${task.name}" in project "${project.name}".`,
        link: notif.link,
        notificationId: notif._id
      }, { attempts: 3, backoff: 5000 });
    } catch (err) {
      console.warn('Failed enqueue email job:', err);
    }
  } else {
    // fallback: nothing to do if no queue
    console.log('No emailQueue configured, skipping email job enqueue.');
  }

  return notif;
}

/**
 * POST /projects/:projectId/tasks/assign
 * Body: { name, description, assignedToId, assignedToName, dueDate, priority, department, status, tags }
 * Creates a task (embedded or collection-based) and performs side effects.
 */
router.post('/:projectId/tasks/assign', async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      assignedToId,
      assignedToName,
      dueDate,
      priority = 'medium',
      department,
      status = 'todo',
      tags = []
    } = req.body;

    if (!name || !assignedToId || !assignedToName) {
      return res.status(400).json({ message: 'Missing required fields: name, assignedToId, assignedToName' });
    }
    if (!isValidObjectId(projectId)) return res.status(400).json({ message: 'Invalid projectId format' });
    if (!isValidObjectId(assignedToId)) return res.status(400).json({ message: 'Invalid assignedToId format' });

    const project = await StoreProject.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const useCollection = process.env.USE_TASK_COLLECTION === 'true';

    let createdTask = null;
    if (useCollection) {
      // create top-level Task
      const t = new Task({
        projectId: project._id,
        name: name.trim(),
        description: description ? String(description).trim() : '',
        assignedToId: assignedToId,
        assignedToName: assignedToName.trim(),
        status,
        priority,
        department,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags
      });
      createdTask = await t.save();
    } else {
      // embedded task inside project.tasks
      if (!Array.isArray(project.tasks)) project.tasks = [];

      const newTask = {
        name: name.trim(),
        description: description ? String(description).trim() : '',
        assignedToId: mongoose.Types.ObjectId(assignedToId),
        assignedToName: assignedToName.trim(),
        status,
        priority,
        department,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags
      };

      project.tasks.push(newTask);
      await project.save();

      // the embedded task (Mongoose subdocument) is the last item
      createdTask = project.tasks[project.tasks.length - 1];
    }

    const notif = await postAssignSideEffects(req.app, assignedToId, project, createdTask);

    return res.status(201).json({ data: { task: createdTask, notification: notif } });
  } catch (err) {
    console.error('Error in /:projectId/tasks/assign', err);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /tasks/users/:userId/assigned
 * Returns tasks assigned to a user.
 * - If USE_TASK_COLLECTION=true -> queries Task collection
 * - otherwise -> scans StoreProject embedded tasks
 */
router.get('/users/:userId/tasks-assigned', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid userId format' });

    const useCollection = process.env.USE_TASK_COLLECTION === 'true';
    if (useCollection) {
      const tasks = await Task.find({ assignedToId: mongoose.Types.ObjectId(userId), deletedAt: { $exists: false } }).lean();
      const projectIds = [...new Set(tasks.filter(t => t.projectId).map(t => String(t.projectId)))];
      const projects = await StoreProject.find({ _id: { $in: projectIds } }).select('name').lean();
      const projectMap = {};
      projects.forEach(p => { projectMap[String(p._id)] = p; });
      const mapped = tasks.map(t => ({ task: t, project: projectMap[String(t.projectId)] || null }));
      return res.json({ data: mapped });
    } else {
      const projects = await StoreProject.find({ 'tasks.assignedToId': mongoose.Types.ObjectId(userId) }).lean();
      const assigned = [];
      projects.forEach(project => {
        (project.tasks || []).forEach(t => {
          if (t && String(t.assignedToId) === String(userId) && !t.deletedAt) {
            assigned.push({ projectId: project._id, projectName: project.name, task: t });
          }
        });
      });
      return res.json({ data: assigned });
    }
  } catch (err) {
    console.error('Error fetching assigned tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});








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
