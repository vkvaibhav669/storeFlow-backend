const { Router } = require('express');
const UnifiedStore = require('../models/Store');
const authorize = require('../middleware/authorize');
const router = Router();

router.get('/', async (req, res) => {
  const stores = await UnifiedStore.find({ deletedAt: { $exists: false } });
  res.json({ data: stores });
});

router.post('/', authorize((perms) => perms.has('store:manage')), async (req, res) => {
  const store = await UnifiedStore.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: store });
});

router.get('/:storeId', async (req, res) => {
  const store = await UnifiedStore.findById(req.params.storeId);
  if (!store || store.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Store not found' } });
  res.json({ data: store });
});

router.patch('/:storeId', authorize((perms) => perms.has('store:manage')), async (req, res) => {
  const store = await UnifiedStore.findByIdAndUpdate(req.params.storeId, req.body, { new: true });
  res.json({ data: store });
});

module.exports = router;