# API Documentation

This document describes all REST API endpoints available in the Claude Code Harness Backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "created_at": "timestamp"
    },
    "token": "jwt-token"
  }
}
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string"
    },
    "token": "jwt-token"
  }
}
```

---

### Get Current User

Get information about the currently authenticated user.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "timestamp"
  }
}
```

---

## Project Endpoints

### List Projects

Get all projects for the authenticated user.

**Endpoint:** `GET /api/projects`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "status": "active|completed|failed",
        "root_path": "string",
        "user_id": "uuid",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

### Get Project

Get a specific project by ID.

**Endpoint:** `GET /api/projects/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "root_path": "string",
    "user_id": "uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

---

### Create Project

Create a new project.

**Endpoint:** `POST /api/projects`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "root_path": "/absolute/path/to/project"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "active",
    "root_path": "string",
    "user_id": "uuid",
    "created_at": "timestamp"
  }
}
```

---

### Update Project

Update an existing project.

**Endpoint:** `PUT /api/projects/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "updated_at": "timestamp"
  }
}
```

---

### Delete Project

Delete a project.

**Endpoint:** `DELETE /api/projects/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## Workflow Endpoints

### Get Available Modes

Get list of all available workflow modes.

**Endpoint:** `GET /api/workflow/modes`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "modes": [
      {
        "name": "prd",
        "displayName": "PRD Generation",
        "description": "Generate Product Requirements Document"
      },
      {
        "name": "architecture",
        "displayName": "Architecture Design",
        "description": "Create system architecture and design documents"
      }
      // ... other modes
    ]
  }
}
```

---

### Get Current Mode

Get the current workflow mode.

**Endpoint:** `GET /api/workflow/mode`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "currentMode": "prd",
    "modeHistory": ["prd", "architecture"]
  }
}
```

---

### Switch Mode

Switch to a different workflow mode.

**Endpoint:** `POST /api/workflow/switch-mode`

**Authentication:** Required

**Request Body:**
```json
{
  "mode": "architecture"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previousMode": "prd",
    "currentMode": "architecture",
    "message": "Mode switched successfully"
  }
}
```

---

### Execute Mode

Execute a workflow mode with input.

**Endpoint:** `POST /api/workflow/execute`

**Authentication:** Required

**Request Body:**
```json
{
  "mode": "prd",
  "input": "Create a task management application with real-time collaboration"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "output": "Execution output...",
    "artifacts": [
      "/path/to/prd.md"
    ],
    "nextMode": "architecture",
    "duration": 15000
  }
}
```

---

### Get Project Progress

Get execution progress for a project.

**Endpoint:** `GET /api/workflow/progress/:projectId`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "currentLayer": 2,
    "totalLayers": 8,
    "currentTask": "2.1",
    "taskStatus": "running",
    "completedTasks": 15,
    "totalTasks": 32,
    "percentage": 47
  }
}
```

---

## Task Endpoints

### List Tasks

Get all tasks for a project.

**Endpoint:** `GET /api/tasks/:projectId`

**Authentication:** Required

**Query Parameters:**
- `layer` (optional): Filter by layer number
- `status` (optional): Filter by status (pending|running|completed|failed)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "task_id": "1.1",
        "layer_num": 1,
        "status": "completed",
        "started_at": "timestamp",
        "completed_at": "timestamp",
        "duration_ms": 5000,
        "error_message": null
      }
    ]
  }
}
```

---

### Get Task Details

Get details of a specific task.

**Endpoint:** `GET /api/tasks/:projectId/:taskId`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "task_id": "1.1",
    "layer_num": 1,
    "status": "completed",
    "output": "Task execution output...",
    "started_at": "timestamp",
    "completed_at": "timestamp",
    "duration_ms": 5000
  }
}
```

---

### Retry Task

Retry a failed task.

**Endpoint:** `POST /api/tasks/:projectId/:taskId/retry`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Task retry initiated",
    "taskId": "1.1",
    "status": "running"
  }
}
```

---

## File Endpoints

### Get File Tree

Get the file tree for a project.

**Endpoint:** `GET /api/files/:projectId/tree`

**Authentication:** Required

**Query Parameters:**
- `path` (optional): Start path (default: project root)

**Response:**
```json
{
  "success": true,
  "data": {
    "tree": {
      "name": "project-root",
      "path": "/absolute/path",
      "type": "directory",
      "children": [
        {
          "name": "src",
          "path": "/absolute/path/src",
          "type": "directory",
          "children": []
        },
        {
          "name": "README.md",
          "path": "/absolute/path/README.md",
          "type": "file",
          "size": 1024
        }
      ]
    }
  }
}
```

---

### Read File

Read file contents.

**Endpoint:** `GET /api/files/:projectId/read`

**Authentication:** Required

**Query Parameters:**
- `path` (required): File path relative to project root

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "src/index.ts",
    "content": "file contents...",
    "size": 2048
  }
}
```

---

### Write File

Create or update a file.

**Endpoint:** `POST /api/files/:projectId/write`

**Authentication:** Required

**Request Body:**
```json
{
  "path": "src/newfile.ts",
  "content": "file contents..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "src/newfile.ts",
    "message": "File written successfully"
  }
}
```

---

### Delete File

Delete a file.

**Endpoint:** `DELETE /api/files/:projectId`

**Authentication:** Required

**Query Parameters:**
- `path` (required): File path relative to project root

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## WebSocket API

Connect to WebSocket at: `ws://localhost:3000`

### Client Messages

#### Execute Mode
```json
{
  "type": "execute_mode",
  "payload": {
    "mode": "prd",
    "input": "Create a task management app"
  }
}
```

#### Switch Mode
```json
{
  "type": "switch_mode",
  "payload": {
    "mode": "architecture"
  }
}
```

#### Retry Task
```json
{
  "type": "retry_task",
  "payload": {
    "taskId": "1.1"
  }
}
```

#### Cancel Execution
```json
{
  "type": "cancel_execution",
  "payload": {}
}
```

#### Subscribe to Progress
```json
{
  "type": "subscribe_progress",
  "payload": {
    "projectId": "uuid"
  }
}
```

### Server Messages

#### Claude Output (Real-time)
```json
{
  "type": "claude_output",
  "payload": {
    "text": "Output from Claude...",
    "stream": true
  },
  "timestamp": 1234567890
}
```

#### Task Progress
```json
{
  "type": "task_progress",
  "payload": {
    "projectId": "uuid",
    "currentLayer": 2,
    "totalLayers": 8,
    "currentTask": "2.1",
    "taskStatus": "running",
    "completedTasks": 15,
    "totalTasks": 32,
    "percentage": 47
  },
  "timestamp": 1234567890
}
```

#### Layer Completed
```json
{
  "type": "layer_completed",
  "payload": {
    "layer_num": 2,
    "status": "completed",
    "completedTasks": 5,
    "failedTasks": 0
  },
  "timestamp": 1234567890
}
```

#### Execution Error
```json
{
  "type": "execution_error",
  "payload": {
    "error": "Error message",
    "taskId": "2.1"
  },
  "timestamp": 1234567890
}
```

#### File Changed
```json
{
  "type": "file_changed",
  "payload": {
    "path": "/path/to/file.ts",
    "type": "create|update|delete"
  },
  "timestamp": 1234567890
}
```

---

## Error Codes

| HTTP Status | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider implementing rate limiting for:
- Authentication endpoints: 5 requests per minute
- Workflow execution: 10 requests per hour per project
- File operations: 100 requests per minute

---

## Versioning

API Version: 1.0.0

Future versions will be prefixed with version number: `/api/v2/...`
