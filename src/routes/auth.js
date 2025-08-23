const { Router } = require('express');
const router = Router();

// NOTE: Stub endpoints. Actual implementation should validate credentials and issue JWT.
router.post('/login', async (req, res) => {
  return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement login to issue JWT' } });
});

router.post('/refresh', async (req, res) => {
  return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement refresh token' } });
});

router.post('/logout', async (req, res) => {
  return res.json({ data: { ok: true } });
});

module.exports = router;