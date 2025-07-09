// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const connectDB = require('./config/db'); // Import DB connection function
const bodyParser = require('body-parser'); // For parsing request bodies
//const mongoExpress = require('mongo-express/lib/middleware');
//const mongoExpressConfig = require('mongo-express/config.default.js');
//mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;

// Import API routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const approvalRequestRoutes = require('./routes/approvalRequestRoutes');
const taskRoutes = require('./routes/tasksRoutes');
const taskCommentRoutes = require('./routes/taskCommentRoutes');
const commentsRepliesRoutes = require('./routes/commentsReplies');



// Connect to the database
connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware to parse JSON request bodies
app.use(express.json()); // Replaces bodyParser.json() in modern Express

// --- API Routes ---
// Authentication routes (public)
app.use('/api/auth', authRoutes);
// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/approval-requests', approvalRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-comments', taskCommentRoutes);
app.use('/api/comment-replies', commentsRepliesRoutes);
app.use('/api/tasks/filter', taskRoutes); // Filter tasks by project, department, or priority
// Add this route for mongo-express admin (protect in production!)
//app.use('/mongo-express', mongoExpress(mongoExpressConfig));
// --- Basic Route for testing server status ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Error Handling Middleware (Optional, but recommended for production) ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack to console
  res.status(500).send('Something broke!'); // Send a generic error response
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access API at http://localhost:${PORT}`);
  console.log(`Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`Protected routes (e.g., Get All Users): GET http://localhost:${PORT}/api/users (requires Bearer token)`);
});
