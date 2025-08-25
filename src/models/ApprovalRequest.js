const mongoose = require('mongoose');
const { Schema } = mongoose;

const DecisionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true },
  action: { type: String, enum: ['approve', 'reject', 'request_changes'], required: true },
  comment: String,
  decidedAt: { type: Date, default: Date.now }
}, { _id: false });

const UnifiedApprovalRequestSchema = new Schema({
  subjectModel: { type: String, required: true, enum: ['UnifiedStore', 'UnifiedProject', 'UnifiedTask', 'UnifiedMilestone', 'UnifiedBlocker', 'UnifiedFile'], index: true },
  subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true },
  approverIds: [{ type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true }],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'changes_requested'], default: 'pending', index: true },
  decisions: [DecisionSchema],
  dueDate: Date,
  note: String,
  deletedAt: Date,
}, { timestamps: true });

UnifiedApprovalRequestSchema.index({ subjectModel: 1, subjectId: 1, status: 1 });

module.exports = mongoose.model('UnifiedApprovalRequest', UnifiedApprovalRequestSchema);