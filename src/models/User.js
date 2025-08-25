const mongoose = require('mongoose');
const { Schema } = mongoose;

const MembershipSchema = new Schema({
  scope: { type: String, enum: ['store', 'project'], required: true },
  scopeId: { type: Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, enum: ['admin', 'member'], required: true },
}, { _id: false });

const UnifiedUserSchema = new Schema({
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  globalRole: { type: String, enum: ['superadmin', 'user'], default: 'user', index: true },
  memberships: [MembershipSchema],
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  lastLoginAt: Date,
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('UnifiedUser', UnifiedUserSchema);