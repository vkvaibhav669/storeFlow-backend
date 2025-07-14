# Testing Mode - Protect Middleware Disabled

## Overview
The protect middleware has been temporarily commented out across all API routes for testing purposes. This allows access to protected endpoints without requiring bearer tokens.

## Changes Made
The following route files have been modified:
- `routes/userRoutes.js` (4 routes)
- `routes/storeRoutes.js` (5 routes) 
- `routes/projectRoutes.js` (4 routes)
- `routes/approvalRequestRoutes.js` (5 routes)
- `routes/taskCommentRoutes.js` (2 routes)
- `routes/tasksRoutes.js` (3 routes)
- `routes/commentsReplies.js` (1 route)

**Total: 24 protected routes now accessible without authentication**

## Pattern Used
For each protected route, the original line was commented and a new line without the `protect` middleware was added:

```javascript
// Original: router.get('/', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/', async (req, res) => {
```

## How to Restore Protection

### Method 1: Manual Restoration
1. For each route file, find lines starting with `// Original:`
2. Uncomment those lines (remove the `// Original:` and `// For testing...` comments)
3. Comment out or delete the new route declarations without `protect`

### Method 2: Git Revert
```bash
git checkout HEAD~1 -- routes/
```

### Method 3: Search and Replace
Use your IDE to find and replace:
- Find: `// Original: router\.`
- Replace: `router.`

Then comment out or remove the duplicate routes without `protect`.

## Testing Notes
- User context (`req.user`) is not available in testing mode
- Role-based authorization is disabled
- Some endpoints may need manual data for testing (e.g., requestorId in approval requests)

## Security Warning
⚠️ **DO NOT DEPLOY TO PRODUCTION WITH THESE CHANGES** ⚠️
Always restore the protect middleware before deploying to production environments.