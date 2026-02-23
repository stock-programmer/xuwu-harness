// 执行选项
export interface ExecutionOptions {
  taskId?: string;
  timeout?: number;
  maxRetries?: number;
  workingDir?: string;
  env?: Record<string, string>;
  onProgress?: (output: string) => void;
  onError?: (error: Error) => void;
}

// 执行结果
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  retries: number;
}

// 进程信息
export interface ProcessInfo {
  id: string;
  taskId?: string;
  startTime: Date;
  status: 'running' | 'completed' | 'failed';
}
