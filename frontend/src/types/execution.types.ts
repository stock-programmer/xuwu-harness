export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface OutputLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface TaskExecution {
  id: string;
  taskId: string;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  exitCode?: number;
  error?: string;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface ExecutionProgress {
  currentLayer: number;
  totalLayers: number;
  completedTasks: number;
  totalTasks: number;
  currentTaskId?: string;
  percentage: number;
  estimatedTimeRemaining?: number;
}
