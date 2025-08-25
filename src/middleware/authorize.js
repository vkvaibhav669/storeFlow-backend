module.exports = function authorize(check) {
  return function (req, res, next) {
    const perms = req.ctx?.permissions || new Set();
    const isSuper = perms.has('all:*');
    if (isSuper) return next();
    const ok = check(perms, req);
    if (!ok) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    next();
  };
};