# Bull Task Queue Configuration

## Overview

Bull task queue has been configured for asynchronous task processing with Redis backend.

## Files Created

- **`src/config/queue.ts`**: Bull queue configuration and event listeners
- **`src/services/queue.service.ts`**: Queue service with task management methods
- **`src/scripts/test-queue.ts`**: Queue functionality test script

## Queue Features

### Queue Configuration
- **Queue Name**: `claude-tasks`
- **Retry Strategy**: Exponential backoff (3 attempts, starting at 2s delay)
- **Job Retention**:
  - Completed: 100 jobs
  - Failed: 200 jobs

### Event Listeners
All queue events are logged via Winston:
- `error` - Queue errors
- `waiting` - Job waiting in queue
- `active` - Job started processing
- `completed` - Job finished successfully
- `failed` - Job failed (with retry info)
- `stalled` - Job stalled (possible worker crash)

## QueueService Methods

### `addClaudeTask(data, options?)`
Add a new Claude task to the queue.
```typescript
const job = await queueService.addClaudeTask({
  taskId: 'unique-task-id',
  prompt: 'Your prompt here',
  projectId: 'optional-project-id',
}, {
  priority: 1,  // Optional: Higher number = higher priority
  delay: 5000,  // Optional: Delay in ms
});
```

### `getTaskStatus(taskId)`
Get the current status of a task.
```typescript
const status = await queueService.getTaskStatus('task-id');
// Returns: { status, progress, data, failedReason, ... }
```

### `cancelTask(taskId)`
Cancel a pending or active task.
```typescript
const cancelled = await queueService.cancelTask('task-id');
```

### `retryTask(taskId)`
Retry a failed task.
```typescript
const retried = await queueService.retryTask('task-id');
```

### `getQueueStats()`
Get queue statistics.
```typescript
const stats = await queueService.getQueueStats();
// Returns: { waiting, active, completed, failed, delayed, total }
```

### `clearQueue()`
Clear all jobs from queue (development only).
```typescript
await queueService.clearQueue(); // Throws error in production
```

### `close()`
Gracefully close queue connection.
```typescript
await queueService.close();
```

## Prerequisites

**Redis must be running** for the queue to function.

### Installing Redis

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
- Download from https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis`

### Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

## Testing

### Test Queue Functionality
**Requires Redis to be running:**
```bash
npm run test:queue
```

This will:
1. Check queue initialization
2. Add a test task
3. Check task status
4. Get queue statistics
5. Cancel the test task
6. Display final stats

## Configuration

Queue configuration is in `src/config/queue.ts`:
- Redis connection settings from environment variables
- Default job options (attempts, backoff, retention)
- Event listeners for monitoring

Redis settings are in `.env.development`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Usage in Application

```typescript
import { queueService } from '@/services/queue.service';

// Add task
const job = await queueService.addClaudeTask({
  taskId: 'task-123',
  prompt: 'Generate code for...',
  projectId: 'proj-456',
});

// Check status
const status = await queueService.getTaskStatus('task-123');

// Get stats
const stats = await queueService.getQueueStats();
```

## Notes

- Queue automatically retries failed jobs with exponential backoff
- All operations are logged for debugging
- Production mode prevents queue clearing
- Task IDs must be unique (used as job IDs)
