// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject'); // Import StoreProject model
const { protect, authorize } = require('../middleware/auth'); // Import authentication middleware

/**
 * @route POST /api/projects
 * @description Create a new store project
 * @access Private/Admin
 */
// Original: router.post('/', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.post('/', async (req, res) => {
  try {
    const newProject = new StoreProject(req.body);
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

//router.get('/', protect, async (req, res) => {
 // .populate('tasks.comments.authorId', 'name email') // Populate task comment authors
// .populate('discussion.authorId', 'name email'); // Populate discussion comment authors
/**
 * @route GET /api/projects
 * @description Get all store projects
 * @access Private
 */
  router.get('/', async (req, res) => {
  try {
    // Populate relevant fields from referenced collections
    const projects = await StoreProject.find({})
      .populate('members.userId', 'name email') // Populate members' user details
      .populate('tasks.assignedToId', 'name email') // Populate task assignees
      .populate('documents.uploadedById', 'name email') // Populate document uploaders
      .populate('blockers.reportedById', 'name email') // Populate blocker reporters
      .lean(); // Use lean() for better performance and cleaner JSON output
      
    // Ensure each project has both _id and id fields properly set
    const projectsWithIds = projects.map(project => ({
      ...project,
      id: project._id.toString(),
      _id: project._id.toString()
    }));

    res.status(200).json(projectsWithIds);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/projects/:id
 * @description Get a single store project by ID
 * @access Private
 */
// Original: router.get('/:id', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/:id', async (req, res) => {
  try {
    // Validate the ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    
    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await StoreProject.findById(req.params.id)
      .populate('members.userId', 'name email')
      .populate('tasks.assignedToId', 'name email')
      .populate('tasks.comments.authorId', 'name email')
      .populate('documents.uploadedById', 'name email')
      .populate('blockers.reportedById', 'name email')
      .populate('discussion.authorId', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Ensure the project has both _id and id fields properly set
    const projectWithId = {
      ...project.toJSON(),
      id: project._id.toString(),
      _id: project._id.toString()
    };
    
    res.status(200).json(projectWithId);
  } catch (error) {
    console.error('Error fetching project:', error);
    // More specific error handling for invalid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/projects/:id
 * @description Update a store project by ID
 * @access Private/Admin
 */
// Original: router.put('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.put('/:id', async (req, res) => {
  try {
    const updatedProject = await StoreProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/projects/:id
 * @description Delete a store project by ID
 * @access Private/Admin
 */
// Original: router.delete('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.delete('/:id', async (req, res) => {
  try {
    const deletedProject = await StoreProject.findByIdAndDelete(req.params.id);

    if (!deletedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({ message: 'Project removed' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
