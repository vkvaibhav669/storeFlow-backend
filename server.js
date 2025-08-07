// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const connectDB = require('./config/db'); // Import DB connection function
const bodyParser = require('body-parser'); // For parsing request bodies
const cors = require('cors');

// Import API routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const approvalRequestRoutes = require('./routes/approvalRequestRoutes');
const taskRoutes = require('./routes/tasksRoutes');
const taskCommentRoutes = require('./routes/taskCommentRoutes');
const commentsRepliesRoutes = require('./routes/commentsReplies');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to the database
connectDB();

// Middleware for parsing JSON request bodies
app.use(express.json());
 
// origin: 'http://3.109.154.71:3000' // Specific origin for production


// Conditional CORS configuration based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  console.log('CORS configured for production origin.');
  app.use(cors({
   origin: 'http://3.109.154.71:3000'
  }));
} else {
  console.log('CORS configured for all origins (development/testing).');
  app.use(cors('http://localhost:3000')); // Allow all origins for development and testing
}

// Conditional middleware application based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  const { protect } = require('./middleware/auth');
  app.use('/api/users', protect); // Apply protection to /api/users route in production
  console.log('Auth protection applied for production environment.');
} else {
  console.log('Auth protection skipped for development/testing environment.');
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/approval-requests', approvalRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-comments', taskCommentRoutes);
app.use('/api/comment-replies', commentsRepliesRoutes);
app.use('/api/tasks/filter', taskRoutes);
app.use('/api/projects/:id/documents', projectRoutes);
// Root endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack to console
  res.status(500).send('Something broke!'); // Send a generic error response
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
