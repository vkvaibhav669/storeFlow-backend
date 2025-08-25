const mongoose = require('mongoose');
const { Schema } = mongoose;

const UnifiedCommentSchema = new Schema({
  subjectModel: { type: String, required: true, enum: ['UnifiedStore', 'UnifiedProject', 'UnifiedTask', 'UnifiedMilestone', 'UnifiedBlocker', 'UnifiedFile', 'UnifiedApprovalRequest'], index: true },
  subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
  parentCommentId: { type: Schema.Types.ObjectId, ref: 'UnifiedComment' },
  body: { type: String, required: true },
  mentionedUserIds: [{ type: Schema.Types.ObjectId, ref: 'UnifiedUser' }],
  attachments: [{
    fileId: { type: Schema.Types.ObjectId, ref: 'UnifiedFile' },
    name: String,
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'UnifiedUser', required: true },
  editedAt: Date,
  deletedAt: Date,
}, { timestamps: true });

UnifiedCommentSchema.index({ subjectModel: 1, subjectId: 1, createdAt: -1 });
UnifiedCommentSchema.index({ parentCommentId: 1 });

module.exports = mongoose.model('UnifiedComment', UnifiedCommentSchema);