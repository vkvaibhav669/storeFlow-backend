const mongoose = require('mongoose');
const { Schema } = mongoose;

const DecisionSchema = new Schema({
  approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, enum: ['accepted', 'rejected', 'pending'], default: 'pending' },
  comment: { type: String, default: '' },
  decidedAt: { type: Date }
}, { _id: false });

const ApprovalRequestSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  resourceType: { type: String },
  resourceId: { type: String },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  decisions: [DecisionSchema],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

ApprovalRequestSchema.methods.recomputeStatus = function () {
  if (!this.decisions || this.decisions.length === 0) {
    this.status = 'pending';
    return;
  }
  // if any rejected => rejected
  if (this.decisions.some(d => d.decision === 'rejected')) {
    this.status = 'rejected';
    return;
  }
  // if all approvers accepted => approved
  const approverIds = this.approvers.map(id => id.toString());
  const acceptedApprovers = this.decisions.filter(d => d.decision === 'accepted').map(d => d.approver.toString());
  const allAccepted = approverIds.every(aid => acceptedApprovers.includes(aid));
  this.status = allAccepted ? 'approved' : 'pending';
};

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
