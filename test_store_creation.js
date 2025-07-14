// Test script to demonstrate the store creation issue
const mongoose = require('mongoose');

// Connect to test database (using memory for testing)
mongoose.connect('mongodb://localhost:27017/test_storeflow', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import the Store model
const Store = require('./models/Store');

async function testStoreCreation() {
  console.log('Testing store creation scenarios...\n');

  // Test 1: Empty object (should fail with validation errors)
  console.log('Test 1: Creating store with empty object...');
  try {
    const store1 = new Store({});
    await store1.save();
    console.log('✅ Store created successfully (unexpected!)');
  } catch (error) {
    console.log('❌ Store creation failed (expected):', error.message);
    console.log('Missing fields:', Object.keys(error.errors));
  }

  // Test 2: Partial data (typical frontend scenario)
  console.log('\nTest 2: Creating store with partial data...');
  try {
    const store2 = new Store({
      name: "Test Store",
      location: "Test Location"
      // Missing: type, status, openingDate
    });
    await store2.save();
    console.log('✅ Store created successfully (unexpected!)');
  } catch (error) {
    console.log('❌ Store creation failed (expected):', error.message);
    console.log('Missing fields:', Object.keys(error.errors));
  }

  // Test 3: Complete valid data
  console.log('\nTest 3: Creating store with complete valid data...');
  try {
    const store3 = new Store({
      name: "Complete Test Store",
      location: "Complete Test Location",
      type: "COCO",
      status: "Operational",
      openingDate: new Date()
    });
    await store3.save();
    console.log('✅ Store created successfully with complete data');
    await Store.findByIdAndDelete(store3._id); // Cleanup
  } catch (error) {
    console.log('❌ Store creation failed (unexpected):', error.message);
  }

  mongoose.connection.close();
}

// Run the test
testStoreCreation().catch(console.error);