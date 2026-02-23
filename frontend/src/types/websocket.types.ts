export type OutputType = 'stdout' | 'stderr';

export interface OutputMessage {
  type: OutputType;
  text: string;
  timestamp?: string;
}

export interface ErrorMessage {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface TaskStatusUpdate {
  taskId: string;
  status: string;
  progress?: number;
  message?: string;
}

export type WebSocketEvent =
  | 'output:stream'
  | 'error'
  | 'task:status'
  | 'task:progress'
  | 'execution:start'
  | 'execution:complete';

export type WebSocketMessageHandler<T = any> = (data: T) => void;
