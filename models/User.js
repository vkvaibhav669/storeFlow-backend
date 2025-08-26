// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

// User model (merge with your existing User model fields as appropriate)
// This file contains the explicit fields used by the new task/notification flows.
// If your repo already has a User model, merge 'assignedTasks' and 'notifications' fields into it.
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String }, // hashed password maybe
  role: { type: String },
  department: { type: String, trim: true }
  // Quick references for assigned tasks (helps the UI display assignments without scanning projects)
  assignedTasks: [{
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProject' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    name: String,
    assignedAt: Date,
    status: String
  }],

  // Store notification IDs for quick lookups and unread counts
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }]
  // Add other existing fields you need below (merge with your current model)
}, { timestamps: true });

// Add your existing indexes/virtuals/methods here if needed


// --- Pre-save hook to hash password before saving ---
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  // Generate a salt (random string) with 10 rounds
  const salt = await bcrypt.genSalt(10);
  // Hash the password using the generated salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Method to compare entered password with hashed password in DB ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // Compare the entered plain text password with the hashed password
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
module.exports = mongoose.model('User', UserSchema, 'users');
