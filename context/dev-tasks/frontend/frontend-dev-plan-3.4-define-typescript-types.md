# Task: 定义全局 TypeScript 类型

## 元数据
- **Task ID**: frontend-dev-plan-3.4
- **Layer**: 3
- **Dependencies**: [2.6]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
- **Estimated Complexity**: Medium

## 目标
定义项目、任务、工作模式、文件等核心业务类型，创建完整的 TypeScript 类型系统。

## 前置条件
- 目录结构已创建（Task 2.6 完成）

## 实现步骤

### 1. 创建项目相关类型
创建 `src/types/project.types.ts`：
```typescript
// 项目类型
export type ProjectType = 'fullstack' | 'frontend' | 'backend';

// 项目状态
export type ProjectStatus =
  | 'initializing'
  | 'ready'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

// 项目配置
export interface ProjectConfig {
  name: string;
  type: ProjectType;
  rootPath: string;
  outputPath: string;
  claudeModel?: string;
  maxRetries?: number;
}

// 项目实体
export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  rootPath: string;
  config: ProjectConfig;
  createdAt: string;
  updatedAt: string;
  currentLayer?: number;
  totalLayers?: number;
  completedTasks?: number;
  totalTasks?: number;
}

// 项目统计
export interface ProjectStats {
  totalProjects: number;
  runningProjects: number;
  completedProjects: number;
  failedProjects: number;
}
```

### 2. 创建任务相关类型
创建 `src/types/task.types.ts`：
```typescript
// 任务状态
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

// 任务元数据
export interface TaskMetadata {
  id: string;
  file: string;
  name: string;
  description: string;
  layer: number;
  dependencies: string[];
  parallelGroup?: string[];
  estimatedComplexity: 'Low' | 'Medium' | 'High';
}

// 任务执行结果
export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  output?: string;
  error?: string;
  retryCount?: number;
}

// 任务节点（DAG）
export interface TaskNode {
  id: string;
  metadata: TaskMetadata;
  status: TaskStatus;
  result?: TaskResult;
  dependencies: string[];
  dependents: string[];
}

// Layer 信息
export interface LayerInfo {
  layerNum: number;
  dependsOn: number[];
  parallel: boolean;
  tasks: TaskMetadata[];
  completedTasks: number;
  totalTasks: number;
}
```

### 3. 创建工作模式类型
创建 `src/types/mode.types.ts`：
```typescript
// 工作模式
export type WorkMode =
  | 'prd'
  | 'architecture'
  | 'dev-plan'
  | 'task-gen'
  | 'task-exec'
  | 'loop-test'
  | 'deploy';

// 模式配置
export interface ModeConfig {
  mode: WorkMode;
  enabled: boolean;
  autoNext?: boolean;
  description: string;
}

// 模式状态
export interface ModeStatus {
  currentMode: WorkMode;
  availableModes: WorkMode[];
  history: {
    mode: WorkMode;
    timestamp: string;
    result: 'success' | 'failed' | 'skipped';
  }[];
}

// Prompt 提交
export interface PromptSubmission {
  mode: WorkMode;
  prompt: string;
  projectId?: string;
  options?: Record<string, any>;
}
```

### 4. 创建文件系统类型
创建 `src/types/file.types.ts`：
```typescript
// 文件节点类型
export type FileNodeType = 'file' | 'directory';

// 文件节点
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileNodeType;
  size?: number;
  extension?: string;
  children?: FileNode[];
  parentId?: string;
  isExpanded?: boolean;
  lastModified?: string;
}

// 文件操作类型
export type FileOperation = 'create' | 'update' | 'delete' | 'rename' | 'move';

// 文件变更
export interface FileChange {
  id: string;
  path: string;
  operation: FileOperation;
  timestamp: string;
  oldPath?: string;
  content?: string;
}

// 文件内容
export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  language?: string;
  size: number;
}

// 文件树配置
export interface FileTreeConfig {
  showHiddenFiles: boolean;
  expandDepth: number;
  excludePatterns: string[];
}
```

### 5. 创建执行结果类型
创建 `src/types/execution.types.ts`：
```typescript
// 执行状态
export type ExecutionStatus =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

// 执行上下文
export interface ExecutionContext {
  projectId: string;
  mode: WorkMode;
  currentLayer: number;
  currentTaskId?: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
}

// 执行进度
export interface ExecutionProgress {
  projectId: string;
  currentLayer: number;
  totalLayers: number;
  currentTask: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  percentage: number;
  estimatedTimeRemaining?: number;
}

// 输出日志
export interface OutputLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

// 流式输出
export interface StreamOutput {
  text: string;
  stream: boolean;
  type: 'stdout' | 'stderr' | 'system';
  timestamp: number;
}
```

### 6. 创建用户和设置类型
创建 `src/types/user.types.ts`：
```typescript
// 用户信息
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'user';
  preferences: UserPreferences;
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  editorSettings: EditorSettings;
  notifications: NotificationSettings;
}

// 编辑器设置
export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: string;
}

// 通知设置
export interface NotificationSettings {
  taskCompletion: boolean;
  taskFailure: boolean;
  layerCompletion: boolean;
  sound: boolean;
  desktop: boolean;
}

// 应用设置
export interface AppSettings {
  apiUrl: string;
  wsUrl: string;
  claudeModel: string;
  maxConcurrentTasks: number;
  autoSave: boolean;
  autoScroll: boolean;
}
```

### 7. 创建统一类型导出
创建 `src/types/index.ts`：
```typescript
// 项目相关
export * from './project.types';

// 任务相关
export * from './task.types';

// 模式相关
export * from './mode.types';

// 文件系统相关
export * from './file.types';

// 执行相关
export * from './execution.types';

// 用户相关
export * from './user.types';

// API 相关
export * from './api.types';

// WebSocket 相关
export * from './websocket.types';
```

### 8. 创建常量定义
创建 `src/constants/modes.ts`：
```typescript
import { WorkMode, ModeConfig } from '@/types/mode.types';

export const WORK_MODES: Record<WorkMode, ModeConfig> = {
  prd: {
    mode: 'prd',
    enabled: true,
    autoNext: true,
    description: '编写产品需求文档（PRD）',
  },
  architecture: {
    mode: 'architecture',
    enabled: true,
    autoNext: true,
    description: '生成架构设计文档',
  },
  'dev-plan': {
    mode: 'dev-plan',
    enabled: true,
    autoNext: true,
    description: '生成开发计划（DAG）',
  },
  'task-gen': {
    mode: 'task-gen',
    enabled: true,
    autoNext: false,
    description: '生成任务文件',
  },
  'task-exec': {
    mode: 'task-exec',
    enabled: true,
    autoNext: false,
    description: '执行任务',
  },
  'loop-test': {
    mode: 'loop-test',
    enabled: true,
    autoNext: false,
    description: '循环测试',
  },
  deploy: {
    mode: 'deploy',
    enabled: true,
    autoNext: false,
    description: '部署上线',
  },
};

export const MODE_ORDER: WorkMode[] = [
  'prd',
  'architecture',
  'dev-plan',
  'task-gen',
  'task-exec',
  'loop-test',
  'deploy',
];
```

创建 `src/constants/config.ts`：
```typescript
export const APP_CONFIG = {
  APP_NAME: 'Claude Code Harness',
  APP_VERSION: '1.0.0',
  DEFAULT_CLAUDE_MODEL: 'claude-sonnet-4',
  MAX_RETRY_ATTEMPTS: 3,
  WEBSOCKET_RECONNECT_DELAY: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  PAGINATION_PAGE_SIZE: 20,
} as const;

export const FILE_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx'],
  MARKDOWN: ['.md'],
  JSON: ['.json'],
  CSS: ['.css', '.scss', '.sass', '.less'],
  HTML: ['.html', '.htm'],
} as const;

export const TASK_STATUS_COLORS = {
  pending: '#d9d9d9',
  running: '#1890ff',
  completed: '#52c41a',
  failed: '#ff4d4f',
  skipped: '#faad14',
} as const;
```

## 期望输出
- ✅ `src/types/project.types.ts` 创建
- ✅ `src/types/task.types.ts` 创建
- ✅ `src/types/mode.types.ts` 创建
- ✅ `src/types/file.types.ts` 创建
- ✅ `src/types/execution.types.ts` 创建
- ✅ `src/types/user.types.ts` 创建
- ✅ `src/types/index.ts` 统一导出
- ✅ `src/constants/modes.ts` 创建
- ✅ `src/constants/config.ts` 创建
- ✅ TypeScript 类型检查通过

## 验证标准
```typescript
import { Project, TaskNode, WorkMode, FileNode, ExecutionProgress } from '@/types';
import { WORK_MODES, APP_CONFIG } from '@/constants';

// 类型应该正确推导
const project: Project = { /* ... */ };
const mode: WorkMode = 'prd';
const config = WORK_MODES[mode];
```

## Claude 执行 Prompt

请为前端项目定义完整的 TypeScript 类型系统，具体要求如下：

1. **创建项目类型**（src/types/project.types.ts）：
   - ProjectType: 'fullstack' | 'frontend' | 'backend'
   - ProjectStatus: 状态枚举
   - ProjectConfig: 项目配置接口
   - Project: 项目实体接口
   - ProjectStats: 项目统计接口

2. **创建任务类型**（src/types/task.types.ts）：
   - TaskStatus: 任务状态枚举
   - TaskMetadata: 任务元数据
   - TaskResult: 任务执行结果
   - TaskNode: DAG 节点
   - LayerInfo: Layer 信息

3. **创建模式类型**（src/types/mode.types.ts）：
   - WorkMode: 7 种工作模式
   - ModeConfig: 模式配置
   - ModeStatus: 模式状态
   - PromptSubmission: Prompt 提交

4. **创建文件类型**（src/types/file.types.ts）：
   - FileNodeType: 文件/目录
   - FileNode: 文件树节点
   - FileOperation: 文件操作类型
   - FileChange: 文件变更
   - FileContent: 文件内容

5. **创建执行类型**（src/types/execution.types.ts）：
   - ExecutionStatus: 执行状态
   - ExecutionContext: 执行上下文
   - ExecutionProgress: 进度信息
   - OutputLog: 日志
   - StreamOutput: 流式输出

6. **创建用户类型**（src/types/user.types.ts）：
   - User: 用户信息
   - UserPreferences: 用户偏好
   - EditorSettings: 编辑器设置
   - NotificationSettings: 通知设置
   - AppSettings: 应用设置

7. **创建常量**：
   - src/constants/modes.ts: WORK_MODES, MODE_ORDER
   - src/constants/config.ts: APP_CONFIG, FILE_EXTENSIONS, TASK_STATUS_COLORS

8. **创建统一导出**（src/types/index.ts）：
   - 导出所有类型定义

9. **验证**：
   - 确保所有类型可以正常导入
   - TypeScript 编译无错误
   - 类型推导正确

确保类型定义完整、准确，覆盖所有业务场景。
