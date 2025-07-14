const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/store
 * @description Get all stores (optionally populate fromProjectId)
 * @access Private
 */
//router.get('/', protect, async (req, res) => {
  router.get('/', async (req, res) => {
  try {
    const stores = await Store.find().populate('fromProjectId');
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/store/:id
 * @description Get a single store by ID
 * @access Private
 */
//router.get('/:id', protect, async (req, res) => {
  router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('fromProjectId');
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/store
 * @description Create a new store
 * @access Private
 */
//router.post('/', protect, async (req, res) => {
  router.post('/', async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json(store);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

/**
 * @route PUT /api/store/:id
 * @description Update a store by ID
 * @access Private
 */
//router.put('/:id', protect, async (req, res) => {
  router.put('/:id', async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

/**
 * @route DELETE /api/store/:id
 * @description Delete a store by ID
 * @access Private
 */
//router.delete('/:id', protect, async (req, res) => {
  router.delete('/:id', async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;