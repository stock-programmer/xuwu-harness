// 消息类型
export type WebSocketMessageType =
  | 'command'
  | 'status'
  | 'output'
  | 'progress'
  | 'error'
  | 'file_changed';

// WebSocket 消息基础结构
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
  correlationId?: string;
}

// 客户端消息类型
export type ClientMessage =
  | ExecuteModeMessage
  | SwitchModeMessage
  | RetryTaskMessage
  | CancelExecutionMessage
  | SubscribeProgressMessage;

export interface ExecuteModeMessage {
  type: 'execute_mode';
  payload: {
    projectId: string;  // 添加项目ID
    mode: string;
    input: string;
  };
}

export interface SwitchModeMessage {
  type: 'switch_mode';
  payload: {
    mode: string;
  };
}

export interface RetryTaskMessage {
  type: 'retry_task';
  payload: {
    taskId: string;
  };
}

export interface CancelExecutionMessage {
  type: 'cancel_execution';
  payload: Record<string, never>;
}

export interface SubscribeProgressMessage {
  type: 'subscribe_progress';
  payload: {
    projectId: string;
  };
}

// 服务器消息类型
export type ServerMessage =
  | ClaudeOutputMessage
  | TaskProgressMessage
  | LayerCompletedMessage
  | ExecutionErrorMessage
  | FileChangedMessage
  | StatusMessage
  | ErrorMessage;

export interface StatusMessage {
  type: 'status';
  payload: {
    message: string;
    [key: string]: any;
  };
  timestamp: number;
  correlationId?: string;
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    error: string;
    details?: string;
    [key: string]: any;
  };
  timestamp: number;
  correlationId?: string;
}

export interface ClaudeOutputMessage {
  type: 'claude_output';
  payload: {
    text: string;
    stream: boolean;
  };
  timestamp: number;
  correlationId?: string;
}

export interface TaskProgressMessage {
  type: 'task_progress';
  payload: {
    projectId: string;
    currentLayer: number;
    totalLayers: number;
    currentTask: string;
    taskStatus: string;
    completedTasks: number;
    totalTasks: number;
    percentage: number;
  };
  timestamp: number;
  correlationId?: string;
}

export interface LayerCompletedMessage {
  type: 'layer_completed';
  payload: {
    layer_num: number;
    status: string;
    completedTasks: number;
    failedTasks: number;
  };
  timestamp: number;
  correlationId?: string;
}

export interface ExecutionErrorMessage {
  type: 'execution_error';
  payload: {
    error: string;
    taskId: string;
  };
  timestamp: number;
  correlationId?: string;
}

export interface FileChangedMessage {
  type: 'file_changed';
  payload: {
    path: string;
    type: 'create' | 'update' | 'delete';
  };
  timestamp: number;
  correlationId?: string;
}
