const jwt = require('jsonwebtoken');
const UnifiedUser = require('../models/User');

module.exports = async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing token' } });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UnifiedUser.findById(payload.sub);
    if (!user || user.deletedAt || user.status !== 'active') {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid user' } });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: err.message } });
  }
};