// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const StoreProject = require('../models/StoreProject'); // Import StoreProject model
const { protect, authorize } = require('../middleware/auth'); // Import authentication middleware
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

/**
 * @route POST /api/projects
 * @description Create a new store project
 * @access Private/Admin
 */
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
router.get('/:id', async (req, res) => {
  try {
    // Validate the ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await StoreProject.findById(req.params.id)
      .populate('members.userId', 'name email')
      .populate('tasks.assignedToId', 'name email')
      .populate('tasks.comments.authorId', 'name email')
      .populate('documents.uploadedById', 'name email')
      .populate('blockers.reportedById', 'name email')
      .populate('discussion.addedById', 'name email') // Populate author of top-level comments
      .populate('discussion.replies.addedById', 'name email'); // Populate author of replies

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

/**
 * @route GET /api/projects/:id/comments
 * @description Get all comments for a specific project, including nested replies
 * @access Private
 */
router.get('/:id/comments', async (req, res) => {
  try {
    // Validate the ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await StoreProject.findById(req.params.id)
      .populate({
        path: 'discussion',
        populate: [
          { path: 'addedById', select: 'name email' }, // Populate author of top-level comment
          {
            path: 'replies', // Populate the replies array within each discussion comment
            populate: [
              { path: 'addedById', select: 'name email' }, // Populate author of first-level reply
              {
                path: 'replies', // Populate the replies array within the first-level reply
                populate: {
                  path: 'addedById',
                  select: 'name email' // Populate author of second-level reply (sub-comment)
                }
              }
            ]
          }
        ]
      })
      .select('discussion name location');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json({
      projectId: project._id,
      projectName: project.name,
      projectLocation: project.location,
      comments: project.discussion || []
    });
  } catch (error) {
    console.error('Error fetching project comments:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/projects/:id/comments
 * @description Add a new top-level comment to a specific project
 * @access Private
 */
router.post('/:id/comments', async (req, res) => {
  try {
    // Validate the ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    // Validate required fields
    const { text, addedById, addedByName } = req.body;
    if (!text || !addedById || !addedByName) {
      return res.status(400).json({ 
        message: 'Missing required fields: text, addedById, and addedByName are required' 
      });
    }

    // Validate addedById format
    if (!mongoose.Types.ObjectId.isValid(addedById)) {
      return res.status(400).json({ message: 'Invalid addedById format' });
    }

    const project = await StoreProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create new comment
    const newComment = {
      text: text.trim(),
      addedById: addedById,
      addedByName: addedByName.trim(),
      addedAt: new Date(),
      replies: []
    };

    // Add comment to project discussion
    project.discussion.push(newComment);
    
    // Save the project
    await project.save();

    // Get the added comment (with generated _id)
    const addedComment = project.discussion[project.discussion.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: addedComment,
      projectId: project._id
    });
  } catch (error) {
    console.error('Error adding project comment:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/projects/:id/comments/:commentId
 * @description Add a reply to a specific comment within a project
 * @access Private
 */
router.post('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id: projectId, commentId } = req.params;
    const { text, addedById, addedByName } = req.body;

    // 1. Validate IDs
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID provided' });
    }
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID provided' });
    }

    // 2. Validate required fields for the reply
    if (!text || !addedById || !addedByName) {
      return res.status(400).json({ 
        message: 'Missing required fields: text, addedById, and addedByName for reply' 
      });
    }
    if (!mongoose.Types.ObjectId.isValid(addedById)) {
      return res.status(400).json({ message: 'Invalid addedById format for reply' });
    }

    // 3. Find the project
    const project = await StoreProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 4. Find the parent comment and add the reply
    let parentCommentFound = false;
    let addedReply = null;

    // Recursive function to find the comment and add a reply
    const findAndAddReply = (commentsArray) => {
      for (let i = 0; i < commentsArray.length; i++) {
        const currentComment = commentsArray[i];
        if (currentComment._id.toString() === commentId) {
          const newReply = {
            text: text.trim(),
            addedById: addedById,
            addedByName: addedByName.trim(),
            addedAt: new Date(),
            replies: [] // Replies to replies
          };
          currentComment.replies.push(newReply);
          addedReply = newReply; // Store the newly added reply
          parentCommentFound = true;
          return true; // Stop searching
        }
        // If the current comment has replies, search within them
        if (currentComment.replies && currentComment.replies.length > 0) {
          if (findAndAddReply(currentComment.replies)) {
            return true; // Reply added in a nested level
          }
        }
      }
      return false;
    };

    findAndAddReply(project.discussion);

    if (!parentCommentFound) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }

    // 5. Save the updated project
    await project.save();

    res.status(201).json({
      message: 'Reply added successfully',
      reply: addedReply,
      projectId: project._id,
      parentCommentId: commentId
    });

  } catch (error) {
    console.error('Error adding reply to project comment:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format in parameters' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
