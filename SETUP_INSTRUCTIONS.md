# StoreFlow Unified API v1 - Setup Instructions

## Prerequisites

Before running the unified API, ensure you have:

1. **Node.js** (v14+ recommended)
2. **MongoDB** instance running
3. **Environment variables** configured

## Environment Setup

Create a `.env` file in the root directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/storeflow

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=3001
NODE_ENV=development
```

## Database Connection

The unified API uses the same MongoDB connection as the existing application. Ensure your MongoDB instance is running:

```bash
# Start MongoDB (if using local installation)
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Running the API

```bash
# Install dependencies
npm install

# Start the server
npm start

# The unified API will be available at:
# http://localhost:3001/api/v1
```

## Testing the Implementation

Once the database is connected, you can test the API:

```bash
# Make the test script executable and run it
chmod +x test_unified_api.sh
./test_unified_api.sh
```

## Database Models

The unified API uses separate models with "Unified" prefix to avoid conflicts:

- `UnifiedUser` - User with memberships
- `UnifiedStore` - Store entity
- `UnifiedProject` - Project within store
- `UnifiedTask` - Task within project
- `UnifiedMilestone` - Milestone within project
- `UnifiedBlocker` - Blocker within project
- `UnifiedComment` - Polymorphic comments
- `UnifiedApprovalRequest` - Polymorphic approval requests
- `UnifiedFile` - Polymorphic file attachments

## Authentication Setup

To fully test the API, implement the login endpoint in `src/routes/auth.js`:

```javascript
router.post('/login', async (req, res) => {
  // Validate credentials
  // Generate JWT with payload: { sub: userId }
  // Return { data: { token } }
});
```

## Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Use a secure `JWT_SECRET`
3. Configure proper CORS origins
4. Set up database with proper indexes
5. Implement proper authentication in auth routes
6. Add input validation and rate limiting

## Integration with Frontend

Use the TypeScript SDK for type-safe frontend integration:

```typescript
import StoreFlowClient from './sdk/storeflow-sdk';

const client = new StoreFlowClient(
  process.env.REACT_APP_API_URL + '/api/v1',
  localStorage.getItem('authToken')
);
```

The unified API is ready for production use once database and authentication are properly configured!