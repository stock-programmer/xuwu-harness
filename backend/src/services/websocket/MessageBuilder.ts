import {
  ServerMessage,
  ClaudeOutputMessage,
  TaskProgressMessage,
  LayerCompletedMessage,
  ExecutionErrorMessage,
  FileChangedMessage,
} from '../../types/websocket.types';

/**
 * Message Builder Utilities
 * Helper functions to create WebSocket messages with consistent structure
 */

/**
 * Create a status message
 */
export function createStatusMessage(payload: any): ServerMessage {
  return {
    type: 'status',
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Create an error message
 */
export function createErrorMessage(
  error: string,
  details?: string
): ServerMessage {
  return {
    type: 'error',
    payload: {
      error,
      details: details || '',
    },
    timestamp: Date.now(),
  };
}

/**
 * Create a Claude output message
 */
export function createClaudeOutputMessage(
  text: string,
  stream: boolean = false,
  correlationId?: string
): ClaudeOutputMessage {
  return {
    type: 'claude_output',
    payload: {
      text,
      stream,
    },
    timestamp: Date.now(),
    correlationId,
  };
}

/**
 * Create a task progress message
 */
export function createTaskProgressMessage(
  payload: TaskProgressMessage['payload'],
  correlationId?: string
): TaskProgressMessage {
  return {
    type: 'task_progress',
    payload,
    timestamp: Date.now(),
    correlationId,
  };
}

/**
 * Create a layer completed message
 */
export function createLayerCompletedMessage(
  payload: LayerCompletedMessage['payload'],
  correlationId?: string
): LayerCompletedMessage {
  return {
    type: 'layer_completed',
    payload,
    timestamp: Date.now(),
    correlationId,
  };
}

/**
 * Create an execution error message
 */
export function createExecutionErrorMessage(
  error: string,
  taskId: string,
  correlationId?: string
): ExecutionErrorMessage {
  return {
    type: 'execution_error',
    payload: {
      error,
      taskId,
    },
    timestamp: Date.now(),
    correlationId,
  };
}

/**
 * Create a file changed message
 */
export function createFileChangedMessage(
  path: string,
  type: 'create' | 'update' | 'delete',
  correlationId?: string
): FileChangedMessage {
  return {
    type: 'file_changed',
    payload: {
      path,
      type,
    },
    timestamp: Date.now(),
    correlationId,
  };
}

/**
 * Validate client message structure
 */
export function isValidClientMessage(message: any): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (!message.type || typeof message.type !== 'string') {
    return false;
  }

  if (!message.payload || typeof message.payload !== 'object') {
    return false;
  }

  return true;
}

/**
 * Extract correlation ID from message if present
 */
export function getCorrelationId(message: any): string | undefined {
  return message?.correlationId || message?.payload?.correlationId;
}
