// routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const Store = require('../models/Store'); // Import Store model
const { protect, authorize } = require('../middleware/auth'); // Import authentication middleware

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
      .populate('managerId', 'name email'); // Populate manager details from User collection

    res.status(200).json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ message: 'Server error' });
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
    const store = await Store.findById(req.params.id)
      .populate('managerId', 'name email') // Populate manager details
      .populate('improvementPoints.addedById', 'name email') // Populate who added improvement points
      .populate('improvementPoints.resolvedById', 'name email') // Populate who resolved improvement points
      .populate('improvementPoints.comments.authorId', 'name email') // Populate comment authors
      .populate('tasks.createdById', 'name email'); // Populate task creators

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json(store);
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;
