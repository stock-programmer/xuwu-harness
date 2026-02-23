# Architecture Documentation

This document describes the system architecture, design patterns, and key components of the Claude Code Harness Backend.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Database Design](#database-design)
6. [Workflow System](#workflow-system)
7. [DAG Execution Engine](#dag-execution-engine)
8. [WebSocket Communication](#websocket-communication)
9. [Design Patterns](#design-patterns)
10. [Security](#security)

---

## System Overview

The Claude Code Harness Backend is a microservices-inspired monolithic application that orchestrates AI-driven development workflows. It integrates Claude Code execution with structured task management, real-time progress tracking, and file system monitoring.

### Key Characteristics

- **Event-Driven**: Uses WebSocket for real-time bidirectional communication
- **Async/Non-Blocking**: Leverages Node.js async I/O for high concurrency
- **Task Queue**: Redis-backed Bull queue for reliable background processing
- **Database-Backed**: Persistent storage for projects, tasks, and execution history
- **Modular**: Clear separation of concerns with dedicated service layers

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web Frontend, CLI, External Services)                         │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             │ HTTP/REST                      │ WebSocket
             ▼                                ▼
┌────────────────────────┐        ┌──────────────────────────────┐
│   REST API Layer       │        │   WebSocket Server Layer     │
│  (Express Routes)      │        │   (ws + Manager)             │
├────────────────────────┤        ├──────────────────────────────┤
│ - Auth Routes          │        │ - Connection Management      │
│ - Project Routes       │        │ - Room Management            │
│ - Workflow Routes      │        │ - Event Handler              │
│ - Task Routes          │        │ - Message Broadcasting       │
│ - File Routes          │        │                              │
└────────────┬───────────┘        └──────────────┬───────────────┘
             │                                   │
             └───────────────┬───────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────────────┐
          │          Middleware Layer                    │
          ├──────────────────────────────────────────────┤
          │ - Authentication (JWT)                       │
          │ - Error Handler                              │
          │ - Request Logger                             │
          │ - CORS                                       │
          └─────────────────┬────────────────────────────┘
                            │
                            ▼
          ┌──────────────────────────────────────────────┐
          │         Service Layer                        │
          ├──────────────────────────────────────────────┤
          │ Workflow Services:                           │
          │ - WorkflowOrchestrator                       │
          │ - Mode Handlers (7 modes)                    │
          │                                              │
          │ Execution Services:                          │
          │ - ClaudeCodeExecutor                         │
          │ - DAG Parser                                 │
          │ - DAG Engine                                 │
          │ - Layer Executor                             │
          │                                              │
          │ Utility Services:                            │
          │ - ProgressTracker                            │
          │ - FileService                                │
          │ - FileSystemMonitor                          │
          │ - QueueService                               │
          └─────────────────┬────────────────────────────┘
                            │
                ┌───────────┴──────────────┬──────────────┐
                ▼                          ▼              ▼
        ┌───────────────┐        ┌─────────────┐  ┌─────────────┐
        │   Database    │        │    Redis    │  │ File System │
        │  (Sequelize)  │        │    Cache    │  │  (Chokidar) │
        ├───────────────┤        │      +      │  └─────────────┘
        │ - PostgreSQL  │        │ Bull Queue  │
        │ - SQLite (dev)│        └─────────────┘
        └───────────────┘
```

---

## Core Components

### 1. Express Application (`app.ts`)

The main Express application that sets up:
- Middleware stack (CORS, body-parser, authentication)
- Route registration
- Error handling
- WebSocket server integration

### 2. Workflow Orchestrator (`services/workflow/WorkflowOrchestrator.ts`)

Central orchestrator managing 7 workflow modes:
- Mode switching and validation
- Context preparation
- Artifact extraction
- Mode transition logic

**Key Methods:**
- `switchMode(mode)` - Switch between workflow modes
- `executeMode(mode, input)` - Execute a specific mode
- `validateModePreconditions(mode)` - Validate mode prerequisites
- `getProjectProgress()` - Get current progress

### 3. Mode Handlers (`services/workflow/handlers/`)

Specialized handlers for each workflow mode:

```typescript
interface BaseModeHandler {
  execute(input: string, context: ModeExecutionContext): Promise<ModeExecutionResult>;
  validatePreconditions(context: ModeExecutionContext): Promise<boolean>;
  validateOutput(result: ModeExecutionResult): Promise<boolean>;
  getModeName(): string;
}
```

**Mode Handlers:**
- `PRDModeHandler` - Generate PRD documents
- `ArchitectureModeHandler` - Create architecture docs
- `DevPlanModeHandler` - Generate DAG development plans
- `TaskGenModeHandler` - Create task implementation guides
- `TaskExecModeHandler` - Execute individual tasks
- `LoopTestModeHandler` - Iterative testing with auto-fix
- `DeployModeHandler` - Deployment configuration generation

### 4. Claude Code Executor (`services/ClaudeCodeExecutor.ts`)

Manages Claude Code process execution:
- Process spawning and management
- Output streaming and capture
- Timeout handling
- Retry logic
- Error handling

### 5. DAG Execution Engine (`services/dag/`)

Layer-based task execution engine:

**Components:**
- `DAGParser` - Parses and validates tasks-index.json
- `DAGEngine` - Orchestrates layer-by-layer execution
- `LayerExecutor` - Executes tasks within a layer in parallel

**Features:**
- Dependency resolution
- Circular dependency detection
- Parallel execution within layers
- Error isolation and handling
- Progress tracking

### 6. WebSocket Manager (`services/websocket/`)

Real-time communication system:

**Components:**
- `WebSocketServer` - Low-level WebSocket server
- `WebSocketManager` - Connection and room management
- `EventHandler` - Business logic integration
- `MessageBuilder` - Message factory utilities

**Features:**
- Room-based broadcasting
- Client subscriptions
- Active execution tracking
- Automatic cleanup

### 7. Progress Tracker (`services/ProgressTracker.ts`)

Tracks and broadcasts execution progress:
- Task-level progress updates
- Layer completion tracking
- Percentage calculation
- Real-time WebSocket broadcasts

### 8. File Service (`services/FileService.ts`)

File system operations:
- File tree generation
- CRUD operations
- Path validation
- Integration with FileSystemMonitor

### 9. File System Monitor (`services/FileSystemMonitor.ts`)

Watches for file changes using Chokidar:
- Real-time file change detection
- WebSocket notifications
- Debounced event handling

---

## Data Flow

### Workflow Execution Flow

```
1. Client sends execute_mode message via WebSocket
   ↓
2. WebSocketManager routes to EventHandler
   ↓
3. EventHandler calls WorkflowOrchestrator.executeMode()
   ↓
4. WorkflowOrchestrator:
   - Validates preconditions
   - Gets appropriate ModeHandler
   - Prepares execution context
   ↓
5. ModeHandler:
   - Validates preconditions
   - Builds Claude prompt
   - Calls ClaudeCodeExecutor.execute()
   ↓
6. ClaudeCodeExecutor:
   - Spawns Claude process
   - Streams output back
   - Handles completion/errors
   ↓
7. ModeHandler:
   - Extracts artifacts
   - Validates output
   - Returns ModeExecutionResult
   ↓
8. EventHandler sends result back to client via WebSocket
```

### DAG Execution Flow

```
1. Client triggers DAG execution
   ↓
2. DAGParser loads and validates tasks-index.json
   ↓
3. DAGEngine iterates through layers sequentially
   ↓
4. For each layer:
   - LayerExecutor spawns parallel task executions
   - Each task queued to Bull
   - Worker processes execute via ClaudeCodeExecutor
   - ProgressTracker updates and broadcasts
   ↓
5. Layer completion:
   - Validate all tasks completed/failed
   - Broadcast layer_completed event
   - Continue to next layer or stop on failure
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ username    │
│ email       │
│ password    │
│ created_at  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴───────────┐
│     Project      │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ name             │
│ description      │
│ status           │
│ root_path        │
│ created_at       │
│ updated_at       │
└──────┬───────────┘
       │ 1
       │
       ├──────────────────┬──────────────────┐
       │ N                │ N                │ N
┌──────┴──────────┐ ┌────┴────────────┐ ┌──┴─────────────┐
│ TaskExecution   │ │ LayerExecution  │ │ FileSnapshot   │
├─────────────────┤ ├─────────────────┤ ├────────────────┤
│ id (PK)         │ │ id (PK)         │ │ id (PK)        │
│ project_id (FK) │ │ project_id (FK) │ │ project_id(FK) │
│ task_id         │ │ layer_num       │ │ file_path      │
│ layer_num       │ │ status          │ │ content        │
│ status          │ │ completed_tasks │ │ version        │
│ started_at      │ │ failed_tasks    │ │ created_at     │
│ completed_at    │ │ started_at      │ └────────────────┘
│ duration_ms     │ │ completed_at    │
│ output          │ │ duration_ms     │
│ error_message   │ └─────────────────┘
└─────────────────┘
```

### Key Models

#### User
- Stores user authentication data
- Bcrypt password hashing
- JWT token generation

#### Project
- Represents a development project
- Links to tasks, layers, and files
- Tracks overall project status

#### TaskExecution
- Individual task execution records
- Stores output, errors, timing
- Used for progress tracking

#### LayerExecution
- Layer-level execution tracking
- Aggregates task statistics
- Layer completion status

#### FileSnapshot
- Version control for generated files
- Content snapshots
- Rollback capability

---

## Workflow System

### 7 Workflow Modes

```
PRD → Architecture → Dev Plan → Task Gen → Task Exec → Loop Test → Deploy
```

Each mode:
1. Has specific preconditions (files from previous modes)
2. Generates specific artifacts
3. Suggests the next mode in the sequence
4. Can be executed independently or in sequence

### Mode State Machine

```
         ┌─────────────────────────────────┐
         │         Any Mode                │
         │   (Manual switching allowed)    │
         └─────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    Linear Progression                        │
├──────────────────────────────────────────────────────────────┤
│  PRD  →  Architecture  →  Dev Plan  →  Task Gen  →  Task    │
│  Exec  →  Loop Test  →  Deploy                              │
└──────────────────────────────────────────────────────────────┘
```

---

## DAG Execution Engine

### DAG Structure (tasks-index.json)

```json
{
  "project_type": "backend",
  "total_tasks": 32,
  "total_layers": 8,
  "layers": {
    "0": {
      "layer_num": 0,
      "depends_on": [],
      "tasks": [...],
      "parallel": true
    },
    "1": {
      "layer_num": 1,
      "depends_on": [0],
      "tasks": [...],
      "parallel": true
    }
  }
}
```

### Execution Strategy

1. **Layer-by-Layer**: Execute layers sequentially
2. **Parallel Within Layer**: Tasks in same layer run in parallel
3. **Dependency Validation**: Check all dependencies before execution
4. **Failure Handling**: Stop layer on first failure (configurable)
5. **Progress Tracking**: Real-time updates via WebSocket

---

## WebSocket Communication

### Connection Lifecycle

```
1. Client connects → ws://localhost:3000
2. Server assigns unique clientId
3. Client sends subscribe_progress with projectId
4. Server adds client to project room
5. All progress updates broadcast to room
6. Client disconnects → automatic cleanup
```

### Room System

- **project:${projectId}**: Project-specific progress updates
- **global**: System-wide notifications
- **user:${userId}**: User-specific notifications

---

## Design Patterns

### 1. Factory Pattern
- `ModeHandlerFactory` creates mode handlers
- `MessageBuilder` creates WebSocket messages

### 2. Strategy Pattern
- Each `ModeHandler` implements different execution strategies
- Interchangeable handlers for different modes

### 3. Observer Pattern
- `ProgressTracker` notifies observers (WebSocket clients) of changes
- `FileSystemMonitor` notifies on file changes

### 4. Singleton Pattern
- `workflowOrchestrator` - single instance
- `claudeCodeExecutor` - shared executor

### 5. Command Pattern
- WebSocket messages as commands
- `EventHandler` dispatches to appropriate handlers

---

## Security

### Authentication
- JWT-based authentication
- Token expiration (7 days default)
- Secure password hashing (bcrypt)

### Authorization
- Project ownership validation
- User-scoped resources
- Middleware-based access control

### Input Validation
- Path traversal prevention
- Input sanitization
- Type validation with TypeScript

### Error Handling
- Sensitive information filtering
- Detailed logging for debugging
- User-friendly error messages

---

## Performance Considerations

### Caching
- Redis caching for frequently accessed data
- In-memory caching for configuration

### Queue Management
- Bull queue for background tasks
- Configurable concurrency
- Retry mechanisms

### Database
- Proper indexing on foreign keys
- Connection pooling
- Query optimization

### File Operations
- Debounced file watching
- Efficient tree traversal
- Stream-based file reading for large files

---

## Scalability

### Horizontal Scaling
- Stateless API design
- WebSocket sticky sessions required
- Shared Redis for queue and cache

### Vertical Scaling
- Configurable worker processes
- Adjustable queue concurrency
- Database connection pooling

---

## Monitoring and Logging

### Logging Levels
- `error`: System errors
- `warn`: Important warnings
- `info`: General information
- `debug`: Detailed debugging

### Log Destinations
- Console (development)
- File rotation (production)
- Structured JSON logging

### Metrics to Monitor
- Task execution duration
- Queue length and processing time
- WebSocket connection count
- Database query performance
- API response times

---

## Future Enhancements

1. **Multi-tenancy**: Full tenant isolation
2. **Webhooks**: External service integration
3. **Advanced Scheduling**: Cron-based task execution
4. **Metrics Dashboard**: Real-time system metrics
5. **Plugin System**: Extensible mode handlers
6. **Distributed Execution**: Multiple execution nodes
7. **Advanced Caching**: Result caching for repeated operations
