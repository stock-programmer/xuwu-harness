# Backend Service Integration - Startup Verification

## Startup Flow

The backend application now has a complete, production-ready startup flow with the following stages:

### Stage 1: Configuration Validation
- Validates all environment variables
- Ensures required configuration is present

### Stage 2: Database Connection (Step 1/7)
- Connects to SQLite or PostgreSQL based on configuration
- Tests database connectivity
- Logs connection status

### Stage 3: Database Schema Sync (Step 2/7)
- In **development mode**: Automatically syncs schema with `alter: true`
- In **production mode**: Skips auto-sync (use migrations instead)

### Stage 4: Redis Connection (Step 3/7)
- Connects to Redis for caching and queue management
- Gracefully handles Redis unavailability (optional service)
- Logs connection status

### Stage 5: WorkflowOrchestrator (Step 4/7)
- Initializes the workflow orchestration engine
- Sets up working directory

### Stage 6: Express Application (Step 5/7)
- Creates Express app with all middleware
- Integrates API routes
- Sets up CORS, body parser, logging

### Stage 7: HTTP & WebSocket Servers (Step 6-7/7)
- Creates HTTP server
- Initializes WebSocket server for real-time communication

### Stage 8: File System Monitor (Optional)
- Monitors `./context` directory for file changes
- Broadcasts changes via WebSocket

## Enhanced Health Check Endpoint

**GET /health**

Returns comprehensive system status:

```json
{
  "status": "ok",
  "timestamp": "2026-02-22T14:59:00.000Z",
  "uptime": 42.5,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "fileMonitor": "active"
  },
  "memory": {
    "used": 125.67,
    "total": 256.00,
    "unit": "MB"
  }
}
```

**Status Values:**
- `ok` - All services healthy
- `degraded` - Database unhealthy
- Returns HTTP 200 for `ok`, HTTP 503 for `degraded`

## Graceful Shutdown

The application implements comprehensive graceful shutdown:

1. **Signal Handling**: Responds to SIGTERM and SIGINT
2. **Shutdown Sequence** (reverse order of startup):
   - Stop accepting new connections
   - Stop file system monitor
   - Close WebSocket connections
   - Close database connections
   - Close Redis connections
3. **Timeout Protection**: Forces shutdown after 30 seconds
4. **Error Handling**: Captures uncaught exceptions and unhandled rejections

## Startup Logs Example

```
============================================================
Starting Claude Code Harness Backend...
Environment: development
Node version: v20.x.x
============================================================
Step 1/7: Connecting to database...
Database connection established successfully (sqlite)
Step 2/7: Syncing database schema...
Database synchronized successfully
Step 3/7: Connecting to Redis...
Redis connection ready
Step 4/7: Initializing WorkflowOrchestrator...
✓ WorkflowOrchestrator initialized
Step 5/7: Creating Express application...
API routes initialized
✓ Express application created
Step 6/7: Creating HTTP server...
Step 7/7: Initializing WebSocket server...
WebSocket server initialized on path /ws
✓ WebSocket server initialized
✓ File system monitor started for: ./context
============================================================
✓ Server started successfully!
------------------------------------------------------------
HTTP Server:       http://0.0.0.0:3000
API Endpoint:      http://0.0.0.0:3000/api
Health Check:      http://0.0.0.0:3000/health
WebSocket:         ws://0.0.0.0:3000/ws
------------------------------------------------------------
Database:          sqlite
Redis:             localhost:6379
============================================================
```

## Testing the Integration

### Basic Health Check
```bash
curl http://localhost:3000/health
```

### API Endpoint Test
```bash
curl http://localhost:3000/api/health
```

### Root Endpoint
```bash
curl http://localhost:3000/
```

## Production Considerations

1. **Database**: Use PostgreSQL with proper migrations
2. **Redis**: Ensure Redis is available for queue management
3. **Logging**: Configure Winston for production log levels
4. **Environment**: Set `NODE_ENV=production`
5. **Process Manager**: Use PM2 or similar for process management
6. **Monitoring**: Monitor `/health` endpoint for service status

## Files Modified

1. **`src/index.ts`** - Complete application bootstrap
2. **`src/app.ts`** - Enhanced health check endpoint
3. **Dependencies** - All services properly integrated
