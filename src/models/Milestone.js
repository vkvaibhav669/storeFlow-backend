const mongoose = require('mongoose');
const { Schema } = mongoose;

const UnifiedMilestoneSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'UnifiedProject', required: true, index: true },
  title: { type: String, required: true },
  dueDate: Date,
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started', index: true },
  sequence: { type: Number, default: 0, index: true },
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('UnifiedMilestone', UnifiedMilestoneSchema);