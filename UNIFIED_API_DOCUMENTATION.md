# StoreFlow Unified API v1

This document describes the new unified API surface for StoreFlow that provides a clean, consistent REST interface for managing Stores, Projects, Tasks, Milestones, Blockers, Comments, Approvals, and Files.

## Overview

The unified API is available at `/api/v1` and runs alongside the existing API routes. It provides:

- **Unified Domain Model**: Clean separation between entities with proper relationships
- **Polymorphic Comments & Approvals**: Comments and approval requests can be attached to any entity
- **RBAC Authorization**: Role-based access control with SuperAdmin, Admin (store/project scoped), and Member roles
- **Consistent Response Format**: All responses use `{ data, meta, links }` envelope
- **Type Safety**: Complete TypeScript SDK available

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

```bash
# Login (stub - needs implementation)
curl -X POST /api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Core Entities

### Stores
```bash
# List stores
GET /api/v1/stores

# Create store (requires store:manage permission)
POST /api/v1/stores

# Get specific store
GET /api/v1/stores/{storeId}

# Update store (requires store:manage permission)
PATCH /api/v1/stores/{storeId}
```

### Projects
```bash
# List projects in a store
GET /api/v1/stores/{storeId}/projects

# Create project (requires store:manage permission)
POST /api/v1/stores/{storeId}/projects

# Get specific project
GET /api/v1/stores/{storeId}/projects/{projectId}

# Update project (requires project:manage or store:manage permission)
PATCH /api/v1/stores/{storeId}/projects/{projectId}
```

### Tasks
```bash
# List tasks in a project
GET /api/v1/stores/{storeId}/projects/{projectId}/tasks

# Create task (requires project:manage permission)
POST /api/v1/stores/{storeId}/projects/{projectId}/tasks

# Get specific task
GET /api/v1/stores/{storeId}/projects/{projectId}/tasks/{taskId}

# Update task (requires project:manage permission)
PATCH /api/v1/stores/{storeId}/projects/{projectId}/tasks/{taskId}
```

### Milestones
```bash
# List milestones in a project
GET /api/v1/stores/{storeId}/projects/{projectId}/milestones

# Create milestone (requires project:manage permission)
POST /api/v1/stores/{storeId}/projects/{projectId}/milestones

# Get specific milestone
GET /api/v1/stores/{storeId}/projects/{projectId}/milestones/{milestoneId}

# Update milestone (requires project:manage permission)
PATCH /api/v1/stores/{storeId}/projects/{projectId}/milestones/{milestoneId}
```

### Blockers
```bash
# List blockers in a project
GET /api/v1/stores/{storeId}/projects/{projectId}/blockers

# Create blocker (requires project:manage permission)
POST /api/v1/stores/{storeId}/projects/{projectId}/blockers

# Get specific blocker
GET /api/v1/stores/{storeId}/projects/{projectId}/blockers/{blockerId}

# Update blocker (requires project:manage permission)
PATCH /api/v1/stores/{storeId}/projects/{projectId}/blockers/{blockerId}
```

## Polymorphic Features

### Comments
Comments can be attached to any entity (Store, Project, Task, Milestone, Blocker, File, ApprovalRequest).

```bash
# List all comments
GET /api/v1/comments

# List comments for a specific entity
GET /api/v1/comments?subjectType=task&subjectId={taskId}

# Create comment on any entity
POST /api/v1/comments
{
  "subjectType": "task",
  "subjectId": "64b7f1d6f1a2b3c4d5e6f7a8",
  "body": "This is a comment",
  "mentionedUserIds": ["64b7f1d6f1a2b3c4d5e6f7a9"],
  "attachments": [{"fileId": "64b7f1d6f1a2b3c4d5e6f7aa", "name": "screenshot.png"}]
}

# Create reply to a comment
POST /api/v1/comments/{commentId}/replies
{
  "body": "This is a reply"
}

# Convenience route for task comments
GET /api/v1/stores/{storeId}/projects/{projectId}/tasks/{taskId}/comments
POST /api/v1/stores/{storeId}/projects/{projectId}/tasks/{taskId}/comments
```

### Approval Requests
Approval requests can be created for any entity except comments.

```bash
# List all approval requests
GET /api/v1/approvals

# List approvals for a specific entity
GET /api/v1/approvals?subjectType=project&subjectId={projectId}&status=pending

# Create approval request
POST /api/v1/approvals
{
  "subjectType": "project",
  "subjectId": "64b7f1d6f1a2b3c4d5e6f7a8",
  "approverIds": ["64b7f1d6f1a2b3c4d5e6f7a9", "64b7f1d6f1a2b3c4d5e6f7ab"],
  "dueDate": "2024-12-31T23:59:59.000Z",
  "note": "Please review and approve this project plan"
}

# Make approval decision
POST /api/v1/approvals/{approvalId}/decisions
{
  "action": "approve", // or "reject" or "request_changes"
  "comment": "Looks good, approved!"
}
```

### Files
Files can be attached to any entity except approval requests.

```bash
# List all files
GET /api/v1/files

# List files for a specific entity
GET /api/v1/files?subjectType=project&subjectId={projectId}

# Create file metadata
POST /api/v1/files
{
  "subjectType": "project",
  "subjectId": "64b7f1d6f1a2b3c4d5e6f7a8",
  "name": "project-plan.pdf",
  "versions": [
    {
      "key": "uploads/project-plan-v1.pdf",
      "url": "https://storage.example.com/uploads/project-plan-v1.pdf",
      "size": 1024768,
      "mimeType": "application/pdf"
    }
  ]
}
```

## User Management

```bash
# Get current user info
GET /api/v1/users/me

# Get specific user
GET /api/v1/users/{userId}
```

## Permissions Model

The API uses a hierarchical permission system:

### Global Roles
- **SuperAdmin**: Full access to everything (`all:*` permission)
- **User**: Default role, requires explicit memberships for access

### Scoped Memberships
Users can have memberships in stores and projects with specific roles:

- **Store Admin** (`store:manage`): Can manage store and all its projects
- **Store Member** (`store:read`): Can read store and its projects
- **Project Admin** (`project:manage`): Can manage specific project
- **Project Member** (`project:read`): Can read specific project

### Permission Checks
- Endpoints requiring management permissions check for appropriate `*:manage` permission
- Endpoints requiring read access accept both `*:manage` and `*:read` permissions
- SuperAdmins bypass all permission checks

## Response Format

All successful responses follow this format:
```json
{
  "data": {}, // or [] for lists
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 25
  },
  "links": {
    "next": "/api/v1/endpoint?page=2"
  }
}
```

Error responses use:
```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Missing token",
    "details": {}
  }
}
```

## TypeScript SDK

A complete TypeScript SDK is available in `sdk/storeflow-sdk.ts`:

```typescript
import StoreFlowClient from './sdk/storeflow-sdk';

const client = new StoreFlowClient('http://localhost:3001/api/v1', 'your-jwt-token');

// Get current user
const user = await client.getCurrentUser();

// List stores
const stores = await client.getStores();

// Create polymorphic comment
const comment = await client.createComment({
  subjectType: 'task',
  subjectId: 'task-id',
  body: 'Great work on this task!'
});

// Create approval request
const approval = await client.createApproval({
  subjectType: 'project',
  subjectId: 'project-id',
  approverIds: ['user1-id', 'user2-id'],
  note: 'Please review project deliverables'
});
```

## OpenAPI Specification

A complete OpenAPI v3 specification is available in `openapi/openapi.yaml` for generating client code and documentation.

## Migration from Existing API

The new API runs alongside the existing API. To migrate:

1. Update frontend to use `/api/v1` endpoints
2. Use the TypeScript SDK for type safety
3. Implement JWT-based authentication
4. Update permission model to use memberships
5. Migrate to polymorphic comments/approvals as needed

The existing API remains fully functional during the migration period.