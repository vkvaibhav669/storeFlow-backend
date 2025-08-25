const { Router } = require('express');
const UnifiedUser = require('../models/User');
const router = Router();

router.get('/me', async (req, res) => {
  res.json({ data: req.user });
});

router.get('/:id', async (req, res) => {
  const user = await UnifiedUser.findById(req.params.id);
  if (!user || user.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  res.json({ data: user });
});

module.exports = router;