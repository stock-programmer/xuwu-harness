# Claude Code Harness - Backend

A powerful backend service that orchestrates AI-driven development workflows using Claude Code, featuring DAG-based task execution, real-time WebSocket communication, and comprehensive workflow management across 7 development modes.

## Overview

The Claude Code Harness Backend provides:

- **7 Workflow Modes**: PRD, Architecture, Dev Plan, Task Generation, Task Execution, Loop Testing, and Deployment
- **DAG Execution Engine**: Layer-by-layer parallel task execution with dependency management
- **Real-time Communication**: WebSocket-based progress tracking and live updates
- **REST API**: Complete CRUD operations for projects, tasks, files, and workflows
- **Progress Tracking**: Automatic calculation and broadcasting of execution progress
- **File System Monitoring**: Real-time file change detection and notifications
- **Mode Handlers**: Specialized handlers for each workflow mode with validation

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (or SQLite for development)
- Redis (for task queuing)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development

# Initialize database
npm run db:init

# Sync database schema
npm run db:sync
```

### Development

```bash
# Run development server with auto-reload
npm run dev

# The server will start on http://localhost:3000
# WebSocket server will be available on ws://localhost:3000
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Environment Variables

See `.env.example` for all available configuration options:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claude_harness
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (DB, Redis, etc.)
│   ├── controllers/    # Request handlers for REST API
│   ├── middleware/     # Express middleware (auth, error handling)
│   ├── models/         # Sequelize database models
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic services
│   │   ├── dag/        # DAG parsing and execution
│   │   ├── websocket/  # WebSocket server and event handling
│   │   └── workflow/   # Workflow orchestration and mode handlers
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (logger, auth, etc.)
│   ├── scripts/        # Database and testing scripts
│   └── app.ts          # Express app setup
├── docs/               # Documentation
│   ├── api.md          # API documentation
│   ├── architecture.md # Architecture documentation
│   └── deployment.md   # Deployment guide
├── logs/               # Application logs
├── .env.example        # Environment variable template
└── package.json        # Project dependencies and scripts
```

## Features

### Workflow Modes

1. **PRD Mode**: Generate Product Requirements Documents
2. **Architecture Mode**: Create system architecture and design documents
3. **Dev Plan Mode**: Generate DAG-structured development plans
4. **Task Gen Mode**: Create detailed task implementation guides
5. **Task Exec Mode**: Execute individual development tasks
6. **Loop Test Mode**: Run tests iteratively until all pass
7. **Deploy Mode**: Prepare deployment configurations

### DAG Execution Engine

- Parses tasks-index.json files with layer-based dependencies
- Executes tasks in parallel within each layer
- Validates DAG structure and detects circular dependencies
- Automatic retry and error handling
- Progress tracking and real-time updates

### WebSocket Events

Client can send:
- `execute_mode`: Execute a workflow mode
- `switch_mode`: Switch between modes
- `retry_task`: Retry a failed task
- `cancel_execution`: Cancel running execution
- `subscribe_progress`: Subscribe to project progress

Server broadcasts:
- `claude_output`: Real-time Claude execution output
- `task_progress`: Progress updates
- `layer_completed`: Layer completion notifications
- `execution_error`: Error notifications
- `file_changed`: File system change events

### REST API

See [API Documentation](./docs/api.md) for complete endpoint reference.

Main endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/workflow/modes` - Get available modes
- `POST /api/workflow/execute` - Execute workflow mode
- `GET /api/files/:projectId` - Get file tree
- `POST /api/files` - Create/update file

## Scripts

```bash
# Database management
npm run db:init          # Initialize database
npm run db:sync          # Sync database schema
npm run db:reset         # Reset database (drop all tables)

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code quality
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Testing
npm run test:queue       # Test task queue
npm run test:executor    # Test Claude executor
```

## Database Models

- **User**: User accounts and authentication
- **Project**: Development projects
- **TaskExecution**: Individual task executions with status and metrics
- **LayerExecution**: Layer-level execution tracking
- **FileSnapshot**: File version snapshots

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.9
- **Web Framework**: Express 5.2
- **WebSocket**: ws 8.19
- **Database**: Sequelize ORM with PostgreSQL/SQLite
- **Caching/Queue**: Redis + Bull
- **Authentication**: JWT
- **Logging**: Winston
- **File Watching**: Chokidar

## Architecture

See [Architecture Documentation](./docs/architecture.md) for detailed system design.

## Deployment

See [Deployment Guide](./docs/deployment.md) for production deployment instructions.

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Add comprehensive logging
- Document complex logic with comments

### Git Workflow

- Commits are automatically linted with ESLint and Prettier (via Husky)
- Write clear commit messages
- Follow conventional commits format

### Testing

- Write unit tests for business logic
- Test API endpoints with integration tests
- Verify WebSocket event handling
- Test DAG execution scenarios

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions, please create an issue in the repository.
