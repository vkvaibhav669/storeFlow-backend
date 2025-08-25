const mongoose = require('mongoose');
const { Schema } = mongoose;

const UnifiedProjectSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'UnifiedStore', required: true, index: true },
  name: { type: String, required: true, index: true },
  type: { type: String, enum: ['setup', 'renovation', 'other'], default: 'setup' },
  status: { type: String, enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'], index: true },
  startDate: Date,
  endDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true },
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('UnifiedProject', UnifiedProjectSchema);