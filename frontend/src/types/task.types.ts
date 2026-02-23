import type { TaskStatus } from './execution.types';

export interface TaskMetadata {
  id: string;
  name: string;
  description: string;
  layer: number;
  dependencies: string[];
  parallelGroup?: string[];
  estimatedComplexity: 'Low' | 'Medium' | 'High';
  files?: string[];
  tags?: string[];
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  output?: string;
  error?: string;
  retryCount: number;
}

export interface TaskNode {
  id: string;
  metadata: TaskMetadata;
  status: TaskStatus;
  dependencies: string[];
  dependents: string[];
  result?: TaskResult;
}

export interface LayerInfo {
  layerNum: number;
  dependsOn: number[];
  parallel: boolean;
  tasks: TaskMetadata[];
  completedTasks: number;
  totalTasks: number;
}
