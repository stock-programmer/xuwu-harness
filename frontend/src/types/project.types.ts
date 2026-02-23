export type ProjectStatus =
  | 'initializing'
  | 'idle'
  | 'ready'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

export type ProjectType = 'fullstack' | 'frontend' | 'backend';

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  rootPath: string;
  outputPath?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;

  // Task execution info
  currentLayer?: number;
  totalLayers?: number;
  completedTasks?: number;
  totalTasks?: number;
  failedTasks?: number;

  // Configuration
  claudeModel?: string;
  maxRetries?: number;
  config?: ProjectConfig;
  metadata?: Record<string, any>;
}

export interface ProjectConfig {
  name: string;
  type: ProjectType;
  rootPath: string;
  outputPath?: string;
  claudeModel?: string;
  maxRetries?: number;
  mode?: string;
  parallel?: boolean;
  retryCount?: number;
  timeout?: number;
  [key: string]: any;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  type: ProjectType;
  rootPath: string;
  outputPath?: string;
  claudeModel?: string;
  maxRetries?: number;
  config?: ProjectConfig;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  config?: ProjectConfig;
  metadata?: Record<string, any>;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProjectStats {
  totalProjects: number;
  runningProjects: number;
  completedProjects: number;
  failedProjects: number;
  pausedProjects?: number;
}
