const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { protect } = require('../middleware/auth');

// GET all stores (optionally populate fromProjectId)
router.get('/', protect, async (req, res) => {
  try {
    const stores = await Store.find().populate('fromProjectId');
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a single store by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('fromProjectId');
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a new store
router.post('/', protect, async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json(store);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// PUT update a store by ID
router.put('/:id', protect, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// DELETE a store by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;