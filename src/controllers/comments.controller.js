const UnifiedComment = require('../models/Comment');

exports.list = async (req, res) => {
  const { subjectType, subjectId, parentCommentId, page = 1, pageSize = 25 } = req.query;
  const filter = {};
  if (subjectType && subjectId) {
    filter.subjectModel = normalizeSubject(subjectType);
    filter.subjectId = subjectId;
  }
  if (req.params.commentId) filter.parentCommentId = req.params.commentId;
  if (parentCommentId) filter.parentCommentId = parentCommentId;
  filter.deletedAt = { $exists: false };

  const skip = (Number(page) - 1) * Number(pageSize);
  const [items, total] = await Promise.all([
    UnifiedComment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
    UnifiedComment.countDocuments(filter),
  ]);

  res.json({ data: items, meta: { total, page: Number(page), pageSize: Number(pageSize) } });
};

exports.create = async (req, res) => {
  const subjectModel = normalizeSubject(req.body.subjectType || req.params.subjectType || req.body.subjectModel);
  const subjectId = req.body.subjectId || req.params.subjectId;
  const parentCommentId = req.params.commentId || req.body.parentCommentId || null;

  const comment = await UnifiedComment.create({
    subjectModel,
    subjectId,
    parentCommentId,
    body: req.body.body,
    mentionedUserIds: req.body.mentionedUserIds || [],
    attachments: req.body.attachments || [],
    createdBy: req.user._id,
  });

  res.status(201).json({ data: comment });
};

function normalizeSubject(s) {
  const map = {
    store: 'UnifiedStore', project: 'UnifiedProject', task: 'UnifiedTask',
    milestone: 'UnifiedMilestone', blocker: 'UnifiedBlocker', file: 'UnifiedFile', approval: 'UnifiedApprovalRequest'
  };
  return map[String(s || '').toLowerCase()] || s;
}