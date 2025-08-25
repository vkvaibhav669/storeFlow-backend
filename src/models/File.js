const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileVersionSchema = new Schema({
  key: String,
  url: String,
  size: Number,
  mimeType: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser' },
}, { _id: false });

const UnifiedFileSchema = new Schema({
  subjectModel: { type: String, required: true, enum: ['UnifiedStore', 'UnifiedProject', 'UnifiedTask', 'UnifiedMilestone', 'UnifiedBlocker', 'UnifiedApprovalRequest'], index: true },
  subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: String,
  versions: [FileVersionSchema],
  currentVersionIndex: { type: Number, default: 0 },
  deletedAt: Date,
}, { timestamps: true });

UnifiedFileSchema.index({ subjectModel: 1, subjectId: 1, createdAt: -1 });

module.exports = mongoose.model('UnifiedFile', UnifiedFileSchema);