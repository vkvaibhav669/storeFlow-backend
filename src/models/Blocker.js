const mongoose = require('mongoose');
const { Schema } = mongoose;

const UnifiedBlockerSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'UnifiedProject', required: true, index: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'UnifiedTask' },
  reason: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
  raisedBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser' },
  deletedAt: Date,
}, { timestamps: true });

UnifiedBlockerSchema.index({ projectId: 1, status: 1, severity: 1 });

module.exports = mongoose.model('UnifiedBlocker', UnifiedBlockerSchema);