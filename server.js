// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const connectDB = require('./config/db'); // Import DB connection function
const bodyParser = require('body-parser'); // For parsing request bodies
//mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;
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
const mongoExpress = require('mongo-express');
// Get the mongo-express middleware and its configuration
const mongoExpressMiddleware = mongoExpress.middleware;


// Declare the variable before using it
const mongoExpressConfig = {};
mongoExpressConfig.mongodb = mongoExpressConfig.mongodb || {};
mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;


// const mongoExpressConfig = require('mongo-express/config.default.js');
// Connect to the database
const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors()); // allows requests from any origin
// OR restrict to a specific origin like this:
app.use(cors({
  origin: 'http://:8000'
}));
// Middleware to parse JSON request bodies
app.use(express.json()); // Replaces bodyParser.json() in modern Express
// ... (your existing imports and code)
// Middleware to protect routes (apply conditionally)
if (process.env.NODE_ENV === 'production') {
  const { protect } = require('./middleware/auth');
  app.use('/api/users', protect); // Apply protection to /api/users route in production
}
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
app.use('/mongo-express', mongoExpressMiddleware);
// Add this route for mongo-express admin (protect in production!)
// server.js
// ... (your existing imports)
// Configure mongo-express to connect to your MongoDB database
// Use the MONGODB_URI environment variable for the connection string
// server.js
// ... (your existing imports)
 // Or however the function is meant to be called
// Access and modify the configuration
//const mongoExpressConfig = mongoExpress.config; // Assuming config is exposed this way

// Configure mongo-express to connect to your MongoDB database
// Use the MONGODB_URI environment variable for the connection string

//const mongoExpressConfig = mongoExpress.config;
//mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;
// Configure mongo-express authentication
// Replace with your desired mongo-express admin username and password
//mongoExpressConfig.basicAuth.username = 'mongo_express_admin';
//mongoExpressConfig.basicAuth.password = 'your_mongo_express_password'; // CHANGE THIS!

// ... (your existing middleware and routes)
// Add this route for mongo-express admin (protect in production!)
// ... (your existing server start code)
// Configure mongo-express authentication
// Replace with your desired mongo-express admin username and password
//const mongoExpressConfig = {};
mongoExpressConfig.basicAuth = {};
mongoExpressConfig.basicAuth.username = 'adminFranchiseKisna';

mongoExpressConfig.basicAuth.password = '7817AdminDiamond'; // CHANGE THIS!
mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;
// ... (your existing middleware and routes)

// Add this route for mongo-express admin (protect in production!)
connectDB();
// ... (your existing server start code)
 // Use the obtained middleware
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
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  // ... (your existing console logs)
});