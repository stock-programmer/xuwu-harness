# Task: 定义全局 TypeScript 类型

## 元数据
- **Task ID**: backend-2.3
- **Layer**: 2
- **Dependencies**: [0.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: Medium

## 目标
定义项目中所有业务类型、API 类型、WebSocket 消息类型、DAG 任务类型等，确保类型安全和代码提示完整。

## 前置条件
- TypeScript 已配置（Task 0.1）

## 实现步骤

### 1. 创建工作模式类型
创建 `src/types/workflow.types.ts`：
```typescript
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
```

### 2. 创建 DAG 任务类型
创建 `src/types/dag.types.ts`：
```typescript
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
```

### 3. 创建 WebSocket 消息类型
创建 `src/types/websocket.types.ts`：
```typescript
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
  | FileChangedMessage;

export interface ClaudeOutputMessage {
  type: 'claude_output';
  payload: {
    text: string;
    stream: boolean;
  };
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
}

export interface LayerCompletedMessage {
  type: 'layer_completed';
  payload: {
    layer_num: number;
    status: string;
    completedTasks: number;
    failedTasks: number;
  };
}

export interface ExecutionErrorMessage {
  type: 'execution_error';
  payload: {
    error: string;
    taskId: string;
  };
}

export interface FileChangedMessage {
  type: 'file_changed';
  payload: {
    path: string;
    type: 'create' | 'update' | 'delete';
  };
}
```

### 4. 创建 API 类型
创建 `src/types/api.types.ts`：
```typescript
// 项目类型
export type ProjectType = 'fullstack' | 'frontend' | 'backend';

// API 响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string;
  type: ProjectType;
  root_path: string;
}

// 执行模式请求
export interface ExecuteModeRequest {
  mode: string;
  input: string;
}
```

### 5. 创建 Claude 执行器类型
创建 `src/types/executor.types.ts`：
```typescript
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
```

### 6. 创建索引文件
创建 `src/types/index.ts`：
```typescript
export * from './workflow.types';
export * from './dag.types';
export * from './websocket.types';
export * from './api.types';
export * from './executor.types';
```

## 期望输出

### 文件结构
```
src/types/
├── index.ts
├── workflow.types.ts
├── dag.types.ts
├── websocket.types.ts
├── api.types.ts
└── executor.types.ts
```

### 导出类型
- 工作流类型
- DAG 任务类型
- WebSocket 消息类型
- API 类型
- 执行器类型

## 验证标准

### 1. TypeScript 类型检查
```bash
npm run build
```
预期：无类型错误

### 2. 类型导入验证
```typescript
import {
  WorkMode,
  Task,
  Layer,
  WebSocketMessage,
  ExecutionResult,
} from '@/types';

const mode: WorkMode = WorkMode.PRD;
const task: Task = {
  id: '1.1',
  file: 'test.md',
  name: 'Test',
  description: 'Test task',
  dependencies: [],
  status: 'pending',
};
```

### 3. 类型提示验证
在 VSCode 中，导入类型后应该有完整的智能提示和自动补全

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/types/ 目录

2. 创建以下类型定义文件：
   - workflow.types.ts: WorkMode 枚举, ModeExecutionResult, ProjectProgress
   - dag.types.ts: TaskStatus, Task, Layer, TaskIndex, TaskResult, LayerResult
   - websocket.types.ts: WebSocketMessage, ClientMessage, ServerMessage 及所有子类型
   - api.types.ts: ApiResponse, PaginatedResponse, CreateProjectRequest
   - executor.types.ts: ExecutionOptions, ExecutionResult, ProcessInfo

3. 创建 types/index.ts 导出所有类型

4. 验证类型定义：
   - 运行 `npm run build`，确保无类型错误
   - 测试导入类型
   - 验证 TypeScript 智能提示工作正常

确保所有类型定义完整、准确、符合项目需求。
