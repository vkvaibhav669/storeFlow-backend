// // models/Comment.js
// const mongoose = require('mongoose');

// // Define the recursive CommentSchema
// const CommentSchema = new mongoose.Schema({
//   _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // MongoDB ObjectId for unique identification
//   authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
//   authorName: { type: String, required: true }, // Denormalized author name for quick display
//   text: { type: String, required: true }, // The content of the comment
//   timestamp: { type: Date, default: Date.now, required: true }, // Timestamp when the comment was created

//   // 'replies' is an array of CommentSchema, allowing for infinite nesting
//   replies: [] // This will hold embedded comments conforming to this schema
// }, {
//   // REMOVED: _id: false,
//   // Mongoose will automatically assign _id to embedded subdocuments in arrays by default.
//   // Since _id is explicitly defined above, it will respect that and auto-generate.
// });

// // To allow for recursive definition, we assign the schema to itself
// // after it's fully defined. Mongoose handles this circular reference.
// CommentSchema.path('replies').schema = CommentSchema;

// // Export the schema directly, as it will be embedded in other schemas
// module.exports = CommentSchema;
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  addedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedByName: { type: String, required: true },
  addedAt: { type: Date, default: Date.now, required: true },
replies: [] // Temporary, will be set to [CommentSchema] below
});

// Set the replies field to be an array of CommentSchema (recursive)
CommentSchema.add({ replies: [CommentSchema] });

module.exports = CommentSchema;