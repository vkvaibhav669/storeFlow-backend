const UnifiedStore = require('../models/Store');
const UnifiedProject = require('../models/Project');

module.exports = async function buildContext(req, res, next) {
  try {
    const storeId = req.params.storeId || req.query.storeId;
    const projectId = req.params.projectId || req.query.projectId;

    const ctx = { store: null, project: null, memberships: [], permissions: new Set() };

    if (storeId) ctx.store = await UnifiedStore.findById(storeId);
    if (projectId) ctx.project = await UnifiedProject.findById(projectId);

    const user = req.user;
    ctx.memberships = user?.memberships || [];

    const isSuper = user?.globalRole === 'superadmin';

    if (isSuper) {
      ctx.permissions.add('all:*');
    } else {
      if (ctx.store) {
        const m = ctx.memberships.find(m => m.scope === 'store' && String(m.scopeId) === String(ctx.store._id));
        if (m) ctx.permissions.add(`store:${m.role === 'admin' ? 'manage' : 'read'}`);
      }
      if (ctx.project) {
        const m = ctx.memberships.find(m => m.scope === 'project' && String(m.scopeId) === String(ctx.project._id));
        if (m) ctx.permissions.add(`project:${m.role === 'admin' ? 'manage' : 'read'}`);
      }
    }

    req.ctx = ctx;
    next();
  } catch (err) {
    return res.status(400).json({ error: { code: 'CONTEXT_ERROR', message: err.message } });
  }
};