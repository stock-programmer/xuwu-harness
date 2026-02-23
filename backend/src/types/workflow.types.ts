// 工作模式枚举
export enum WorkMode {
  PRD = 'prd',
  ARCHITECTURE = 'architecture',
  DEV_PLAN = 'dev_plan',
  TASK_GEN = 'task_gen',
  TASK_EXEC = 'task_exec',
  LOOP_TEST = 'loop_test',
  DEPLOY = 'deploy',
}

// 模式执行结果
export interface ModeExecutionResult {
  success: boolean;
  output: string;
  artifacts: string[];
  nextMode?: WorkMode;
  error?: string;
  duration?: number;
}

// 项目进度
export interface ProjectProgress {
  currentMode: WorkMode;
  totalTasks: number;
  completedTasks: number;
  currentLayer: number;
  totalLayers: number;
  percentage: number;
}
