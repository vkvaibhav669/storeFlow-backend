const mongoose = require('mongoose');
const { Schema } = mongoose;

const UnifiedStoreSchema = new Schema({
  name: { type: String, required: true, index: true },
  code: { type: String, unique: true, sparse: true },
  address: { type: String },
  status: { type: String, enum: ['planning', 'active', 'closed'], default: 'planning', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true },
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('UnifiedStore', UnifiedStoreSchema);