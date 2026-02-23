// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// 任务定义
export interface Task {
  id: string;
  file: string;
  name: string;
  description: string;
  dependencies: string[];
  status: TaskStatus;
  started_at?: Date | null;
  completed_at?: Date | null;
  error?: string | null;
}

// 层级定义
export interface Layer {
  layer_num: number;
  depends_on: number[];
  tasks: Task[];
  parallel: boolean;
  status: TaskStatus;
}

// 任务索引
export interface TaskIndex {
  project_type: 'frontend' | 'backend' | 'fullstack';
  version: string;
  created_at: string;
  total_tasks: number;
  total_layers: number;
  max_parallel: number;
  layers: Record<string, Layer>;
  dag_mermaid: string;
}

// 任务执行结果
export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  output: string;
  validation?: ValidationResult;
  duration?: number;
  error?: string;
}

// 层级执行结果
export interface LayerResult {
  layer_num: number;
  status: TaskStatus;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  failures: TaskResult[];
  duration: number;
}

// 验证结果
export interface ValidationResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}
