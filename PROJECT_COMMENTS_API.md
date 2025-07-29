# Project Comments API Documentation

## Overview
This implementation adds comment functionality to projects in the StoreFlow backend system. The API allows users to add comments to projects and retrieve all comments for a specific project.

## Endpoints

### GET /api/projects/:id/comments
**Description**: Retrieve all comments for a specific project  
**Method**: GET  
**URL Parameters**: 
- `id` (required) - Project ObjectId

**Response Format**:
```json
{
  "projectId": "string",
  "projectName": "string", 
  "projectLocation": "string",
  "comments": [
    {
      "_id": "string",
      "text": "string",
      "addedById": "string",
      "addedByName": "string", 
      "addedAt": "date",
      "replies": []
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 400: Invalid project ID format
- 404: Project not found
- 500: Server error

### POST /api/projects/:id/comments
**Description**: Add a new comment to a specific project  
**Method**: POST  
**URL Parameters**:
- `id` (required) - Project ObjectId

**Request Body**:
```json
{
  "text": "string (required)",
  "addedById": "string (required) - User ObjectId", 
  "addedByName": "string (required) - User display name"
}
```

**Response Format**:
```json
{
  "message": "Comment added successfully",
  "comment": {
    "_id": "string",
    "text": "string",
    "addedById": "string",
    "addedByName": "string",
    "addedAt": "date", 
    "replies": []
  },
  "projectId": "string"
}
```

**Status Codes**:
- 201: Comment created successfully
- 400: Invalid request (missing fields, invalid ID format)
- 404: Project not found
- 500: Server error

## Implementation Details

### Database Integration
- Uses existing `discussion` field in the StoreProject model
- Leverages existing CommentSchema for consistent comment structure
- Supports nested replies (though not exposed in these endpoints)

### Validation
- Validates MongoDB ObjectId format for project IDs and user IDs
- Ensures required fields are present and non-empty
- Provides descriptive error messages for debugging

### Population
- GET endpoint populates user details for comment authors
- Maintains referential integrity with User model

## Usage Examples

### Get Project Comments
```bash
curl -X GET http://:8000/api/projects/507f1f77bcf86cd799439011/comments
```

### Add Project Comment
```bash
curl -X POST http://:8000/api/projects/507f1f77bcf86cd799439011/comments \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a great project update!",
    "addedById": "507f1f77bcf86cd799439012", 
    "addedByName": "John Doe"
  }'
```