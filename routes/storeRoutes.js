// routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const Store = require('../models/Store'); // Import Store model
const { protect, authorize } = require('../middleware/auth'); // Import authentication middleware
const mongoose = require('mongoose');

/**
 * @route POST /api/stores
 * @description Create a new store
 * @access Private/Admin
 */
// Original: router.post('/', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.post('/', async (req, res) => {
  try {
    const newStore = new Store(req.body);
    const savedStore = await newStore.save();
    res.status(201).json(savedStore);
  } catch (error) {
    console.error('Error creating store:', error);
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/stores
 * @description Get all stores
 * @access Private
 */
// Original: router.get('/', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/', async (req, res) => {
  try {
    // Optionally populate manager details if needed (adjust based on your schema's needs)
    const stores = await Store.find({})
      .populate('managerId', 'name email') // Populate manager details from User collection
      .lean(); // Use lean() for better performance

    // Ensure each store has both _id and id fields properly set
    const storesWithIds = stores.map(store => ({
      ...store,
      id: store._id.toString(),
      _id: store._id.toString()
    }));

    res.status(200).json(storesWithIds);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/stores/:id
 * @description Get a single store by ID
 * @access Private
 */
// Original: router.get('/:id', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/:id', async (req, res) => {
  try {
    // Validate the ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ message: 'Invalid store ID provided' });
    }
    
    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid store ID format' });
    }

    const store = await Store.findById(req.params.id)
      .populate('managerId', 'name email') // Populate manager details
      .populate('improvementPoints.addedById', 'name email') // Populate who added improvement points
      .populate('improvementPoints.resolvedById', 'name email') // Populate who resolved improvement points
      .populate('improvementPoints.comments.authorId', 'name email') // Populate comment authors
      //.populate('tasks.createdById', 'name email'); // Populate task creators

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    // Ensure the store has both _id and id fields properly set
    const storeWithId = {
      ...store.toJSON(),
      id: store._id.toString(),
      _id: store._id.toString()
    };
    
    res.status(200).json(storeWithId);
  } catch (error) {
    console.error('Error fetching store:', error);
    // More specific error handling for invalid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid store ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/stores/:id
 * @description Update a store by ID
 * @access Private/Admin
 */
// Original: router.put('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.put('/:id', async (req, res) => {
  try {
    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return the updated document and run Mongoose validators
    );

    if (!updatedStore) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json(updatedStore);
  } catch (error) {
    console.error('Error updating store:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/stores/:id
 * @description Delete a store by ID
 * @access Private/Admin
 */
// Original: router.delete('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.delete('/:id', async (req, res) => {
  try {
    const deletedStore = await Store.findByIdAndDelete(req.params.id);

    if (!deletedStore) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json({ message: 'Store removed' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all improvement points for a specific store
// GET /api/stores/:storeId/improvementPoints
/**
 * @route GET /api/stores/:storeId/improvementPoints/:pointId
 * @description GET all improvement points for a store
 * @access Private
 */
router.get('/:storeId/improvementPoints/', async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.status(200).json(store.improvementPoints);
  } catch (error) {
    console.error('Error fetching improvement points:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a single improvement point by ID for a specific store
// GET /api/stores/:storeId/improvementPoints/:pointId
// /**
//  * @route GET /api/stores/:storeId/improvementPoints/:pointId
//  * @description GET a specific improvement point for a store
//  * @access Private
//  */
// router.get('/:storeId/improvementPoints/:pointId', async (req, res) => {
//   try {
//     const { storeId, pointId } = req.params;
//     const store = await Store.findById(storeId);

//     if (!store) {
//       return res.status(404).json({ message: 'Store not found' });
//     }

//     const improvementPoint = store.improvementPoints.id(pointId); // Mongoose helper to find subdocument by _id

//     if (!improvementPoint) {
//       return res.status(404).json({ message: 'Improvement point not found' });
//     }

//     res.status(200).json(improvementPoint);
//   } catch (error) {
//     console.error('Error fetching single improvement point:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// POST a new improvement point to a specific store
// POST /api/stores/:storeId/improvementPoints
// /:pointId
/** 
 * @route POST /api/stores/:storeId/improvementPoints/:pointId
 * @description add an improvement point for a store
 * @access Private
 */
router.post('/:storeId/improvementPoints/:pointId', async (req, res) => {
  try {
    const { storeId , pointId} = req.params;
    const newImprovementPoint = req.body;
    console.log('New Improvement Point:', newImprovementPoint);
    // Convert addedById to ObjectId if it's a valid ObjectId string
    if (newImprovementPoint.addedById && mongoose.Types.ObjectId.isValid(newImprovementPoint.addedById)) {
      newImprovementPoint.addedById = new mongoose.Types.ObjectId(newImprovementPoint.addedById);
    }

    // Basic validation for required fields
    if (
      !newImprovementPoint.text?.trim() ||
      !newImprovementPoint.addedById ||
      !newImprovementPoint.addedByName?.trim()
    ) {
      return res.status(400).json({ message: 'Missing required fields: text, addedById, addedByName' });
    }

    const store = await Store.findById(storeId.trim());

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.improvementPoints.push(newImprovementPoint);
    await store.save();

    res.status(201).json(store.improvementPoints[store.improvementPoints.length - 1]);
  } catch (error) {
    console.error('Error adding improvement point:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT (Update) an existing improvement point in a specific store
// PUT /api/stores/:storeId/improvementPoints/:pointId
/**
 * @route PUT /api/stores/:storeId/improvementPoints/:pointId
 * @description update an improvement point for a store
 * @access Private
 */
router.put('/:storeId/improvementPoints/:pointId', async (req, res) => {
  try {
    const { storeId, pointId } = req.params;
    const updateData = req.body; // Data to update the improvement point with

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const improvementPoint = store.improvementPoints.id(pointId);

    if (!improvementPoint) {
      return res.status(404).json({ message: 'Improvement point not found' });
    }

    // Update fields of the subdocument
    Object.assign(improvementPoint, updateData);

    await store.save(); // Save the parent document

    res.status(200).json(improvementPoint);
  } catch (error) {
    console.error('Error updating improvement point:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /api/stores/:storeId/improvementPoints/:pointId
 * @description Delete an improvement point for a store
 * @access Private
 */
// DELETE an improvement point from a specific store
// DELETE /api/stores/:storeId/improvementPoints/:pointId
router.delete('/:storeId/improvementPoints/:pointId', async (req, res) => {
  try {
    const { storeId, pointId } = req.params;

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Use Mongoose's pull method to remove the subdocument by its _id
    store.improvementPoints.pull({ _id: pointId });

    await store.save(); // Save the parent document

    res.status(200).json({ message: 'Improvement point deleted successfully' });
  } catch (error) {
    console.error('Error deleting improvement point:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// routes/taskRoutes.js
/**
 * @route POST /api/stores/:storeId/tasks
 * @description Add a new task to a specific store
 * @access Public
 * @param {String} storeId - The ID of the store to which the task will be added
 * @body {Object} taskData - The task data to be added
 */
router.post('/:storeId/tasks', async (req, res) => {
  try {
    const { storeId } = req.params;
    const taskData = req.body;

    // Validate required fields
    if (!taskData.title || !taskData.status || !taskData.priority || !taskData.createdBy) {
      return res.status(400).json({ message: 'Task title, status, priority, and createdBy are required.' });
    }

    // Prepare the new task object based on StoreTask interface
    const newTask = {
      _id: new mongoose.Types.ObjectId(),
      storeId: storeId,
      title: taskData.title,
      description: taskData.description || '',
      assignedTo: taskData.assignedTo || '',
      status: taskData.status,
      priority: taskData.priority,
      createdBy: taskData.createdBy,
      createdAt: new Date().toISOString(),
      dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined
    };

    // Find the store and add the task
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.tasks.push(newTask);
    await store.save();

    res.status(201).json(store.tasks[store.tasks.length - 1]);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
