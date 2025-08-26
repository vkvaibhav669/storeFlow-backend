// Top-level Task model (optional; used when USE_TASK_COLLECTION=true)
//
// Notes & testing:
// - If you plan to keep using embedded tasks inside StoreProject, you don't need this file.
// - To enable using this collection, set env USE_TASK_COLLECTION=true in your runtime.
//
// Indexes are created for projectId and assignedToId to help queries like "tasks assigned to user".
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'StoreProject', required: true, index: true },
  name: { type: String, required: true, index: true },
  description: String,
  assignedToId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  assignedToName: String,
  status: { type: String, enum: ['todo', 'in_progress', 'blocked', 'done'], default: 'todo', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
  department: String,
  dueDate: Date,
  tags: [String],
  deletedAt: Date
}, { timestamps: true });

TaskSchema.index({ projectId: 1, assignedToId: 1 });

module.exports = mongoose.model('Task', TaskSchema);
