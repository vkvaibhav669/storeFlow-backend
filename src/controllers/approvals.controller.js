const UnifiedApprovalRequest = require('../models/ApprovalRequest');

exports.list = async (req, res) => {
  const { subjectType, subjectId, status, page = 1, pageSize = 25 } = req.query;
  const filter = {};
  if (subjectType && subjectId) {
    filter.subjectModel = normalizeSubject(subjectType);
    filter.subjectId = subjectId;
  }
  if (status) filter.status = status;
  filter.deletedAt = { $exists: false };

  const skip = (Number(page) - 1) * Number(pageSize);
  const [items, total] = await Promise.all([
    UnifiedApprovalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
    UnifiedApprovalRequest.countDocuments(filter),
  ]);

  res.json({ data: items, meta: { total, page: Number(page), pageSize: Number(pageSize) } });
};

exports.create = async (req, res) => {
  const ar = await UnifiedApprovalRequest.create({
    subjectModel: normalizeSubject(req.body.subjectType),
    subjectId: req.body.subjectId,
    requestedBy: req.user._id,
    approverIds: req.body.approverIds,
    dueDate: req.body.dueDate,
    note: req.body.note,
  });
  res.status(201).json({ data: ar });
};

exports.decide = async (req, res) => {
  const { approvalId } = req.params;
  const { action, comment } = req.body;
  const ar = await UnifiedApprovalRequest.findById(approvalId);
  if (!ar) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Approval not found' } });

  ar.decisions.push({ userId: req.user._id, action, comment });

  const approverSet = new Set(ar.approverIds.map(String));
  const lastByUser = new Map(ar.decisions.map(d => [String(d.userId), d.action]));
  const allApproved = [...approverSet].every(uid => lastByUser.get(uid) === 'approve');
  const anyReject = [...lastByUser.values()].includes('reject');
  const anyChanges = [...lastByUser.values()].includes('request_changes');

  if (anyReject) ar.status = 'rejected';
  else if (anyChanges) ar.status = 'changes_requested';
  else if (allApproved) ar.status = 'approved';
  else ar.status = 'pending';

  await ar.save();
  res.json({ data: ar });
};

function normalizeSubject(s) {
  const map = {
    store: 'UnifiedStore', project: 'UnifiedProject', task: 'UnifiedTask',
    milestone: 'UnifiedMilestone', blocker: 'UnifiedBlocker', file: 'UnifiedFile'
  };
  return map[String(s || '').toLowerCase()] || s;
}