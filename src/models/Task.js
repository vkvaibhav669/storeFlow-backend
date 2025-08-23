const mongoose = require('mongoose');
const { Schema } = mongoose;

const UnifiedTaskSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'UnifiedProject', required: true, index: true },
  title: { type: String, required: true, index: true },
  description: String,
  assigneeId: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', index: true },
  status: { type: String, enum: ['todo', 'in_progress', 'blocked', 'done'], default: 'todo', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
  dueDate: Date,
  tags: [String],
  deletedAt: Date,
}, { timestamps: true });

UnifiedTaskSchema.index({ projectId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('UnifiedTask', UnifiedTaskSchema);