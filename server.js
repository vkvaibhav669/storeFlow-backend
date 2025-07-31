// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const connectDB = require('./config/db'); // Import DB connection function
const bodyParser = require('body-parser'); // For parsing request bodies
//.mongodb.connectionString = process.env.MONGODB_URI;
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
// const mongoExpress = require('mongo-express');
const app = express();
const PORT = process.env.PORT || 8000;
// app.use('/mongo-express', mongoExpressMiddleware);
app.use(cors()); // allows requests from any origin
// OR restrict to a specific origin like this:
app.use(cors({
  origin: 'http://:8000'
}));
app.use(express.json()); 
if (process.env.NODE_ENV === 'production') {
  const { protect } = require('./middleware/auth');
  app.use('/api/users', protect); // Apply protection to /api/users route in production
}
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/approval-requests', approvalRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-comments', taskCommentRoutes);
app.use('/api/comment-replies', commentsRepliesRoutes);
app.use('/api/tasks/filter', taskRoutes); 
// const mongoExpressConfig = mongoExpress.config || {};
// mongoExpressConfig.mongodb = mongoExpressConfig.mongodb || {};
// mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;
 
// mongoExpressConfig.basicAuth = {};
// mongoExpressConfig.basicAuth.username = 'adminFranchiseKisna';
// mongoExpressConfig.basicAuth.password = '7817AdminDiamond'; 
// mongoExpressConfig.mongodb.connectionString = process.env.MONGODB_URI;

connectDB();
app.get('/', (req, res) => {
  res.send('API is running...');
});
// --- Error Handling Middleware (Optional, but recommended for production) ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack to console
  res.status(500).send('Something broke!'); // Send a generic error response
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  // ... (your existing console logs)
});