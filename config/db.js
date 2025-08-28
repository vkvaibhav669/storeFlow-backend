// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  console.log("Trying to connect to DB");
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connecting ...")
    console.log(`MongoDB Connected to host := : ${conn.connection.host}`);
  } catch (error) {
    // Log any connection errors and exit the process
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB; // Export the function to be used in server.js
