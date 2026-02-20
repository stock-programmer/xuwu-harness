# Claude Code Harness - 后端架构设计文档

## 1. 架构概述

### 1.1 系统定位
后端服务是 Claude Code Harness 平台的核心引擎，负责：
- 管理 Web 前端与 Claude Code CLI 之间的交互
- 编排和执行 DAG 工作流任务
- 实时通信和状态同步
- 数据持久化和任务追踪
- 文件系统监控和管理

### 1.2 设计原则
- **高并发执行**：支持 DAG 层级内任务并行执行
- **可靠性优先**：任务执行失败重试、状态持久化
- **实时响应**：WebSocket 双向通信，低延迟输出回显
- **模块化设计**：解耦各功能模块，便于扩展
- **资源隔离**：进程级别隔离 Claude Code 执行环境

### 1.3 关键指标
- WebSocket 连接稳定性 > 99%
- 任务执行成功率 > 90%
- 输出回显延迟 < 100ms
- 支持 10+ 并发任务执行
- 文件变更检测延迟 < 500ms

---

## 2. 技术栈选型

### 2.1 核心框架
**推荐方案：Node.js + Express**

**选型理由**：
- **异步 I/O 优势**：Node.js 的事件驱动模型天然适合处理大量并发任务和 WebSocket 连接
- **进程管理能力**：child_process 模块可高效管理 Claude CLI 进程
- **生态丰富**：WebSocket (ws)、文件监控 (chokidar)、任务调度等库成熟
- **统一技术栈**：与前端 JavaScript/TypeScript 技术栈一致，便于全栈开发

**替代方案：Python + FastAPI**
- 优势：数据处理能力强，适合复杂的 DAG 算法实现
- 劣势：异步并发模型不如 Node.js 成熟

### 2.2 技术栈清单

| 类别 | 技术选型 | 用途 |
|------|---------|------|
| 运行时 | **Node.js 20+ (LTS)** | 后端运行环境 |
| Web 框架 | **Express 4.x** | HTTP API 服务 |
| WebSocket | **ws 8.x** | 实时双向通信 |
| 进程管理 | **child_process (内置)** | 执行 Claude CLI |
| 文件监控 | **chokidar 3.x** | 文件系统变更监听 |
| 任务队列 | **Bull 4.x** | 基于 Redis 的任务队列 |
| 数据库 ORM | **Sequelize 6.x** | 支持 SQLite/PostgreSQL |
| 缓存 | **ioredis 5.x** | Redis 客户端 |
| 日志 | **Winston 3.x** | 结构化日志 |
| 进程守护 | **PM2** | 生产环境进程管理 |
| 类型检查 | **TypeScript 5.x** | 类型安全 |

### 2.3 数据存储

**关系数据库**：
- **开发环境**：SQLite（零配置，快速启动）
- **生产环境**：PostgreSQL 14+（高并发、事务支持）

**缓存**：
- **Redis 7.x**：
  - 任务队列（Bull）
  - 实时数据缓存（任务状态、进度）
  - WebSocket 会话管理
  - 分布式锁（并发控制）

**文件存储**：
- **本地文件系统**：
  - PRD/架构/开发计划文档（`context/` 目录）
  - 项目源代码
  - 日志文件

---

## 3. 系统架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                  (WebSocket + REST API)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Business Logic Layer                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │   Workflow   │ │   DAG Task   │ │   Claude     │    │
│  │ Orchestrator │ │  Scheduler   │ │  Executor    │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Data Access Layer                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  Database    │ │    Redis     │ │ File System  │    │
│  │   Service    │ │   Service    │ │   Service    │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3.2 核心组件架构

```
┌──────────────────────────────────────────────────────────┐
│                       Backend Server                      │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │              WebSocket Manager                     │  │
│  │  - Connection Pool                                 │  │
│  │  - Message Router                                  │  │
│  │  - Stream Handler (Claude Output)                  │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                    │                                      │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │           Workflow Orchestrator                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Mode Manager                                 │ │  │
│  │  │ - PRD Mode                                   │ │  │
│  │  │ - Architecture Mode                          │ │  │
│  │  │ - Dev Plan Mode                              │ │  │
│  │  │ - Task Generation Mode                       │ │  │
│  │  │ - Execution Mode                             │ │  │
│  │  │ - Test Loop Mode                             │ │  │
│  │  │ - Deploy Mode                                │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Progress Tracker                             │ │  │
│  │  │ - Task Status Monitor                        │ │  │
│  │  │ - Layer Progress Calculator                  │ │  │
│  │  │ - Real-time Metrics Collector                │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                    │                                      │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │              DAG Execution Engine                  │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ DAG Parser & Validator                       │ │  │
│  │  │ - tasks-index.json Parser                    │ │  │
│  │  │ - Dependency Graph Builder                   │ │  │
│  │  │ - Cycle Detection                            │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Layer-wise Scheduler                         │ │  │
│  │  │ - Layer Sequencer                            │ │  │
│  │  │ - Parallel Task Pool (同层并行)              │ │  │
│  │  │ - Dependency Resolver                        │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Task Executor Pool                           │ │  │
│  │  │ - Worker Thread Pool                         │ │  │
│  │  │ - Task Queue (Bull)                          │ │  │
│  │  │ - Result Collector                           │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                    │                                      │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │           Claude Code Executor                     │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Process Manager                              │ │  │
│  │  │ - spawn() / exec() Wrapper                   │ │  │
│  │  │ - Process Pool (最大10个并发)                 │ │  │
│  │  │ - Process Lifecycle Management               │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Output Stream Handler                        │ │  │
│  │  │ - stdout/stderr Capture                      │ │  │
│  │  │ - Real-time Streaming to WebSocket           │ │  │
│  │  │ - Output Buffering & Chunking                │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Retry & Error Handler                        │ │  │
│  │  │ - Auto Retry (最多3次)                        │ │  │
│  │  │ - Error Classification                       │ │  │
│  │  │ - Fallback Strategy                          │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │            File System Monitor                     │  │
│  │  - Watch context/ directory                       │  │
│  │  - Detect file changes (create/update/delete)     │  │
│  │  - Notify frontend via WebSocket                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Test & Deploy Manager                   │  │
│  │  - Build & Start Service                          │  │
│  │  - Log Collection                                  │  │
│  │  - UAT Test Runner                                 │  │
│  │  - Agentic Loop (Test → Fix → Retry)              │  │
│  │  - Git Operations                                  │  │
│  │  - Deployment Scripts                              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 核心模块设计

### 4.1 WebSocket Manager

**职责**：
- 管理客户端 WebSocket 连接
- 路由消息到对应处理器
- 实时推送 Claude 输出流
- 会话状态管理

**接口设计**：

```typescript
interface WebSocketManager {
  // 连接管理
  handleConnection(ws: WebSocket, req: Request): void;
  handleDisconnection(clientId: string): void;

  // 消息路由
  handleMessage(clientId: string, message: WebSocketMessage): void;

  // 广播消息
  broadcast(message: WebSocketMessage): void;
  broadcastToClient(clientId: string, message: WebSocketMessage): void;

  // 流式输出
  streamClaudeOutput(clientId: string, stream: ReadableStream): void;
}

interface WebSocketMessage {
  type: 'command' | 'status' | 'output' | 'progress' | 'error';
  payload: any;
  timestamp: number;
  correlationId?: string;
}
```

**消息类型**：

```typescript
// 客户端 -> 服务器
type ClientMessage =
  | { type: 'execute_mode', payload: { mode: string, input: string } }
  | { type: 'switch_mode', payload: { mode: string } }
  | { type: 'retry_task', payload: { taskId: string } }
  | { type: 'cancel_execution', payload: {} }
  | { type: 'subscribe_progress', payload: { projectId: string } };

// 服务器 -> 客户端
type ServerMessage =
  | { type: 'claude_output', payload: { text: string, stream: boolean } }
  | { type: 'task_progress', payload: TaskProgress }
  | { type: 'layer_completed', payload: LayerStatus }
  | { type: 'execution_error', payload: { error: string, taskId: string } }
  | { type: 'file_changed', payload: { path: string, type: 'create' | 'update' | 'delete' } };
```

**实现要点**：
- **心跳机制**：每 30s 发送 ping，60s 无响应断开
- **重连策略**：客户端断线后保留会话 5 分钟
- **消息确认**：关键消息（任务状态）需要 ACK 确认
- **背压处理**：输出流过快时缓冲，避免客户端消息堆积

---

### 4.2 Workflow Orchestrator

**职责**：
- 管理 7 种工作模式的切换
- 协调各模式的执行流程
- 跟踪整体项目进度
- 处理模式间的数据传递

**模式状态机**：

```mermaid
stateDiagram-v2
    [*] --> PRD模式
    PRD模式 --> 架构模式: PRD完成
    架构模式 --> 开发计划模式: 架构完成
    开发计划模式 --> 任务生成模式: 开发计划完成
    任务生成模式 --> 执行模式: 任务文档生成完成
    执行模式 --> 测试模式: 所有任务完成
    测试模式 --> 发布模式: 测试通过
    发布模式 --> [*]: 部署完成

    执行模式 --> 执行模式: Layer完成
    测试模式 --> 测试模式: 修复循环

    任意模式 --> 任意模式: 手动切换
```

**接口设计**：

```typescript
interface WorkflowOrchestrator {
  // 模式管理
  switchMode(mode: WorkMode): Promise<void>;
  getCurrentMode(): WorkMode;
  getAvailableTransitions(): WorkMode[];

  // 执行控制
  executeCurrentMode(input: string): Promise<ModeExecutionResult>;
  pauseExecution(): void;
  resumeExecution(): void;
  cancelExecution(): void;

  // 进度跟踪
  getProjectProgress(): ProjectProgress;
  getModeProgress(mode: WorkMode): ModeProgress;
}

type WorkMode =
  | 'prd'
  | 'architecture'
  | 'dev-plan'
  | 'task-generation'
  | 'execution'
  | 'test-loop'
  | 'deploy';

interface ModeExecutionResult {
  success: boolean;
  output: string;
  artifacts: string[]; // 生成的文件路径
  nextMode?: WorkMode;
  error?: string;
}
```

**执行流程**：

```typescript
class WorkflowOrchestrator {
  async executeCurrentMode(input: string): Promise<ModeExecutionResult> {
    const mode = this.currentMode;

    // 1. 验证模式前置条件
    const validation = await this.validateModePreconditions(mode);
    if (!validation.valid) {
      throw new Error(`Mode precondition failed: ${validation.error}`);
    }

    // 2. 准备执行上下文
    const context = await this.prepareExecutionContext(mode, input);

    // 3. 调用对应模式处理器
    const handler = this.modeHandlers[mode];
    const result = await handler.execute(context);

    // 4. 验证输出
    const outputValidation = await this.validateModeOutput(mode, result);
    if (!outputValidation.valid) {
      return { success: false, error: outputValidation.error };
    }

    // 5. 保存状态和产物
    await this.persistModeResult(mode, result);

    // 6. 确定下一步模式
    const nextMode = this.determineNextMode(mode, result);

    return {
      success: true,
      output: result.output,
      artifacts: result.files,
      nextMode
    };
  }
}
```

---

### 4.3 DAG Execution Engine

**职责**：
- 解析和验证 DAG 任务索引
- 按层级调度任务执行
- 管理层内并行任务池
- 处理依赖关系和执行顺序
- 任务失败处理和重试

**核心算法**：

```typescript
interface DAGExecutionEngine {
  // DAG 解析
  parseTaskIndex(filePath: string): TaskIndex;
  validateDAG(taskIndex: TaskIndex): ValidationResult;

  // 执行调度
  executeLayers(taskIndex: TaskIndex): Promise<ExecutionResult>;
  executeLayer(layer: Layer): Promise<LayerResult>;
  executeTask(task: Task): Promise<TaskResult>;

  // 依赖管理
  resolveDependencies(task: Task): Task[];
  checkDependenciesCompleted(task: Task): boolean;

  // 失败处理
  retryTask(task: Task, maxRetries: number): Promise<TaskResult>;
  handleLayerFailure(layer: Layer, failures: TaskResult[]): FailureStrategy;
}

interface TaskIndex {
  project_type: 'frontend' | 'backend' | 'fullstack';
  total_tasks: number;
  total_layers: number;
  max_parallel: number;
  layers: Record<string, Layer>;
  dag_mermaid: string;
}

interface Layer {
  layer_num: number;
  depends_on: number[];
  tasks: Task[];
  parallel: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface Task {
  id: string; // "1.1", "2.3"
  file: string; // "frontend-dev-plan-1.1-init-project.md"
  name: string;
  description: string;
  dependencies: string[]; // ["1.1", "1.2"]
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  error?: string;
}
```

**Layer 执行算法**：

```typescript
class DAGExecutionEngine {
  async executeLayers(taskIndex: TaskIndex): Promise<ExecutionResult> {
    const layers = Object.values(taskIndex.layers)
      .sort((a, b) => a.layer_num - b.layer_num);

    const results: LayerResult[] = [];

    for (const layer of layers) {
      console.log(`开始执行 Layer ${layer.layer_num} (${layer.tasks.length}个任务)`);

      // 检查依赖层是否完成
      if (!this.checkLayerDependencies(layer, results)) {
        throw new Error(`Layer ${layer.layer_num} 依赖未满足`);
      }

      // 执行当前层（并行）
      const layerResult = await this.executeLayer(layer);
      results.push(layerResult);

      // 检查失败
      if (layerResult.status === 'failed') {
        const strategy = await this.handleLayerFailure(layer, layerResult.failures);

        if (strategy === 'abort') {
          console.log(`Layer ${layer.layer_num} 失败，终止执行`);
          break;
        } else if (strategy === 'retry') {
          // 重试整层
          const retryResult = await this.executeLayer(layer);
          results[results.length - 1] = retryResult;
        }
        // 'skip' 策略：继续执行下一层
      }

      console.log(`Layer ${layer.layer_num} 完成 ✅`);
    }

    return {
      success: results.every(r => r.status === 'completed'),
      layers: results,
      totalTasks: taskIndex.total_tasks,
      completedTasks: results.reduce((sum, r) => sum + r.completedTasks, 0)
    };
  }

  async executeLayer(layer: Layer): Promise<LayerResult> {
    const startTime = Date.now();

    // 并行执行所有任务
    const taskPromises = layer.tasks.map(task =>
      this.executeTask(task)
        .catch(error => ({
          taskId: task.id,
          status: 'failed' as const,
          error: error.message
        }))
    );

    const taskResults = await Promise.all(taskPromises);

    // 统计结果
    const failures = taskResults.filter(r => r.status === 'failed');
    const completed = taskResults.filter(r => r.status === 'completed');

    return {
      layer_num: layer.layer_num,
      status: failures.length === 0 ? 'completed' : 'failed',
      totalTasks: layer.tasks.length,
      completedTasks: completed.length,
      failedTasks: failures.length,
      failures: failures,
      duration: Date.now() - startTime
    };
  }

  async executeTask(task: Task): Promise<TaskResult> {
    // 1. 读取任务文档
    const taskDoc = await this.fileService.readFile(
      `context/dev-tasks/${task.file}`
    );

    // 2. 提取 Claude prompt
    const prompt = this.extractClaudePrompt(taskDoc);

    // 3. 更新状态为 running
    await this.updateTaskStatus(task.id, 'running');

    // 4. 执行 Claude
    const claudeResult = await this.claudeExecutor.execute(prompt, {
      taskId: task.id,
      timeout: 600000, // 10分钟超时
      onProgress: (output) => {
        this.emitProgress(task.id, output);
      }
    });

    // 5. 验证输出
    const validation = await this.validateTaskOutput(task, claudeResult);

    // 6. 更新状态
    const status = validation.success ? 'completed' : 'failed';
    await this.updateTaskStatus(task.id, status, claudeResult);

    return {
      taskId: task.id,
      status,
      output: claudeResult.output,
      validation,
      duration: claudeResult.duration
    };
  }
}
```

**并发控制**：

```typescript
class TaskExecutorPool {
  private maxConcurrent: number = 10;
  private queue: Task[] = [];
  private running: Map<string, Promise<TaskResult>> = new Map();

  async executeTasks(tasks: Task[]): Promise<TaskResult[]> {
    this.queue = [...tasks];
    const results: TaskResult[] = [];

    while (this.queue.length > 0 || this.running.size > 0) {
      // 填充执行池
      while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
        const task = this.queue.shift()!;
        const promise = this.executeTask(task);
        this.running.set(task.id, promise);
      }

      // 等待任意一个完成
      const result = await Promise.race(this.running.values());
      results.push(result);
      this.running.delete(result.taskId);
    }

    return results;
  }
}
```

---

### 4.4 Claude Code Executor

**职责**：
- 管理 `claude -p` 进程生命周期
- 捕获和流式传输输出
- 错误处理和自动重试
- 并发执行控制

**接口设计**：

```typescript
interface ClaudeCodeExecutor {
  // 执行命令
  execute(prompt: string, options: ExecutionOptions): Promise<ExecutionResult>;

  // 进程管理
  spawn(prompt: string): ChildProcess;
  kill(processId: string): void;
  getRunningProcesses(): ProcessInfo[];

  // 输出处理
  captureOutput(process: ChildProcess): ReadableStream;
  streamToWebSocket(stream: ReadableStream, clientId: string): void;
}

interface ExecutionOptions {
  taskId?: string;
  timeout?: number; // 毫秒
  maxRetries?: number;
  workingDir?: string;
  env?: Record<string, string>;
  onProgress?: (output: string) => void;
  onError?: (error: Error) => void;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  retries: number;
}
```

**实现**：

```typescript
class ClaudeCodeExecutor {
  private processPool: Map<string, ChildProcess> = new Map();

  async execute(prompt: string, options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    let retries = 0;
    const maxRetries = options.maxRetries || 3;

    while (retries <= maxRetries) {
      try {
        const result = await this.executeOnce(prompt, options);

        return {
          success: true,
          output: result.output,
          exitCode: 0,
          duration: Date.now() - startTime,
          retries
        };
      } catch (error) {
        retries++;

        if (retries > maxRetries) {
          return {
            success: false,
            output: '',
            error: error.message,
            exitCode: error.exitCode || 1,
            duration: Date.now() - startTime,
            retries
          };
        }

        // 指数退避重试
        await this.sleep(Math.pow(2, retries) * 1000);
      }
    }
  }

  private async executeOnce(prompt: string, options: ExecutionOptions): Promise<{output: string}> {
    return new Promise((resolve, reject) => {
      const process = spawn('claude', ['-p', prompt], {
        cwd: options.workingDir || process.cwd(),
        env: { ...process.env, ...options.env },
        shell: true
      });

      const processId = `${options.taskId || 'unnamed'}-${Date.now()}`;
      this.processPool.set(processId, process);

      let output = '';
      let errorOutput = '';

      // 捕获 stdout
      process.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;

        // 实时回调
        if (options.onProgress) {
          options.onProgress(text);
        }
      });

      // 捕获 stderr
      process.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString();
      });

      // 超时处理
      const timeout = options.timeout || 600000; // 默认10分钟
      const timer = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      // 进程退出
      process.on('exit', (code) => {
        clearTimeout(timer);
        this.processPool.delete(processId);

        if (code === 0) {
          resolve({ output });
        } else {
          reject({
            message: `Claude process exited with code ${code}`,
            exitCode: code,
            stderr: errorOutput
          });
        }
      });

      // 错误处理
      process.on('error', (error) => {
        clearTimeout(timer);
        this.processPool.delete(processId);
        reject(error);
      });
    });
  }

  // 优雅关闭所有进程
  async shutdown(): Promise<void> {
    const killPromises = Array.from(this.processPool.values()).map(proc => {
      return new Promise<void>((resolve) => {
        proc.once('exit', () => resolve());
        proc.kill('SIGTERM');

        // 5秒后强制杀死
        setTimeout(() => {
          proc.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    });

    await Promise.all(killPromises);
  }
}
```

---

### 4.5 File System Monitor

**职责**：
- 监控 `context/` 和项目源代码目录
- 检测文件创建、修改、删除事件
- 通过 WebSocket 通知前端更新文件树

**实现**：

```typescript
class FileSystemMonitor {
  private watcher: FSWatcher;
  private wsManager: WebSocketManager;

  start(watchPaths: string[]): void {
    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', path => this.handleFileChange('create', path))
      .on('change', path => this.handleFileChange('update', path))
      .on('unlink', path => this.handleFileChange('delete', path))
      .on('addDir', path => this.handleFileChange('create', path))
      .on('unlinkDir', path => this.handleFileChange('delete', path));
  }

  private handleFileChange(type: 'create' | 'update' | 'delete', path: string): void {
    this.wsManager.broadcast({
      type: 'file_changed',
      payload: {
        path: path,
        type: type,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  stop(): void {
    this.watcher?.close();
  }
}
```

---

### 4.6 Test & Deploy Manager

**职责**：
- 启动和监控应用服务
- 运行 UAT 测试
- Agentic Loop 自动修复
- Git 操作和代码发布
- 生产环境部署

**接口设计**：

```typescript
interface TestDeployManager {
  // 测试循环
  startTestLoop(config: TestLoopConfig): Promise<TestLoopResult>;
  runUATTests(testSuite: string): Promise<TestResult[]>;
  analyzeTestFailures(failures: TestResult[]): Promise<FailureAnalysis>;
  autoFix(analysis: FailureAnalysis): Promise<FixResult>;

  // 部署
  gitCommitAndPush(message: string): Promise<void>;
  createRelease(version: string, notes: string): Promise<Release>;
  deployToProduction(platform: DeployPlatform, config: DeployConfig): Promise<DeployResult>;
}

interface TestLoopConfig {
  maxIterations: number; // 最大修复迭代次数
  testSuite: string;
  autoFix: boolean;
  stopOnSuccess: boolean;
}

interface TestLoopResult {
  success: boolean;
  iterations: number;
  finalTestResults: TestResult[];
  fixes: FixResult[];
}
```

**Agentic Loop 实现**：

```typescript
class AgenticTestLoop {
  async run(config: TestLoopConfig): Promise<TestLoopResult> {
    let iteration = 0;
    const fixes: FixResult[] = [];

    while (iteration < config.maxIterations) {
      iteration++;
      console.log(`\n=== Test Loop Iteration ${iteration} ===`);

      // 1. 启动服务
      await this.startServices();

      // 2. 运行测试
      const testResults = await this.runTests(config.testSuite);

      // 3. 检查是否全部通过
      const failures = testResults.filter(t => !t.passed);
      if (failures.length === 0) {
        console.log('✅ 所有测试通过！');
        return {
          success: true,
          iterations: iteration,
          finalTestResults: testResults,
          fixes
        };
      }

      console.log(`❌ ${failures.length} 个测试失败`);

      // 4. 自动修复
      if (config.autoFix) {
        const analysis = await this.analyzeFailures(failures);
        const fixResult = await this.applyFixes(analysis);
        fixes.push(fixResult);

        if (!fixResult.success) {
          console.log('修复失败，终止循环');
          break;
        }
      } else {
        // 等待人工介入
        await this.waitForManualFix();
      }

      // 5. 停止服务准备下一轮
      await this.stopServices();
    }

    return {
      success: false,
      iterations: iteration,
      finalTestResults: await this.runTests(config.testSuite),
      fixes
    };
  }

  private async analyzeFailures(failures: TestResult[]): Promise<FailureAnalysis> {
    const errorLogs = failures.map(f => f.error).join('\n\n');

    const prompt = `
分析以下测试失败并提供修复方案：

${errorLogs}

请提供：
1. 错误原因分析
2. 需要修改的文件和具体修改内容
3. 修复后的测试预期
`;

    const result = await this.claudeExecutor.execute(prompt);

    return {
      rootCauses: this.parseRootCauses(result.output),
      suggestedFixes: this.parseSuggestedFixes(result.output),
      affectedFiles: this.parseAffectedFiles(result.output)
    };
  }

  private async applyFixes(analysis: FailureAnalysis): Promise<FixResult> {
    const fixPrompt = `
根据以下分析结果修复代码：

${JSON.stringify(analysis, null, 2)}

请直接执行必要的代码修改。
`;

    const result = await this.claudeExecutor.execute(fixPrompt);

    return {
      success: result.success,
      changedFiles: this.detectChangedFiles(),
      fixDescription: result.output
    };
  }
}
```

---

## 5. 数据库设计

### 5.1 Schema 设计

**projects 表**：
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'fullstack' | 'frontend' | 'backend'
    status VARCHAR(50) NOT NULL, -- 'initializing' | 'development' | 'testing' | 'deployed'
    current_mode VARCHAR(50), -- 当前工作模式
    root_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(type);
```

**task_executions 表**：
```sql
CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id VARCHAR(50) NOT NULL, -- "1.1", "2.3"
    layer_num INTEGER NOT NULL,
    task_file VARCHAR(500) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending' | 'running' | 'completed' | 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    claude_prompt TEXT,
    claude_output TEXT,
    validation_result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_executions_project ON task_executions(project_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_layer ON task_executions(layer_num);
```

**layer_executions 表**：
```sql
CREATE TABLE layer_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_num INTEGER NOT NULL,
    total_tasks INTEGER NOT NULL,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'pending' | 'running' | 'completed' | 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_layer_executions_project ON layer_executions(project_id);
CREATE INDEX idx_layer_executions_layer ON layer_executions(layer_num);
```

**execution_logs 表**：
```sql
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_execution_id UUID REFERENCES task_executions(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL, -- 'info' | 'warn' | 'error' | 'debug'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_execution_logs_project ON execution_logs(project_id);
CREATE INDEX idx_execution_logs_task ON execution_logs(task_execution_id);
CREATE INDEX idx_execution_logs_level ON execution_logs(level);
CREATE INDEX idx_execution_logs_created ON execution_logs(created_at);
```

**test_runs 表**：
```sql
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    iteration INTEGER NOT NULL,
    total_tests INTEGER NOT NULL,
    passed_tests INTEGER NOT NULL,
    failed_tests INTEGER NOT NULL,
    test_results JSONB NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_runs_project ON test_runs(project_id);
```

**deployments 表**：
```sql
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'aws' | 'vercel' | 'azure' | 'railway'
    environment VARCHAR(50) NOT NULL, -- 'production' | 'staging'
    status VARCHAR(50) NOT NULL, -- 'pending' | 'deploying' | 'success' | 'failed'
    deployment_url VARCHAR(500),
    git_commit_sha VARCHAR(100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deployments_project ON deployments(project_id);
CREATE INDEX idx_deployments_status ON deployments(status);
```

### 5.2 ORM 模型（Sequelize）

```typescript
// models/Project.ts
import { Model, DataTypes } from 'sequelize';

class Project extends Model {
  public id!: string;
  public name!: string;
  public type!: 'fullstack' | 'frontend' | 'backend';
  public status!: string;
  public current_mode!: string;
  public root_path!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Project.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  current_mode: {
    type: DataTypes.STRING(50)
  },
  root_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'projects',
  underscored: true
});
```

---

## 6. API 设计

### 6.1 REST API

**项目管理**：
```
POST   /api/projects              # 创建项目
GET    /api/projects              # 列出项目
GET    /api/projects/:id          # 获取项目详情
PUT    /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
```

**工作流控制**：
```
POST   /api/projects/:id/modes/:mode/execute    # 执行指定模式
POST   /api/projects/:id/modes/:mode/switch     # 切换模式
GET    /api/projects/:id/progress               # 获取项目进度
GET    /api/projects/:id/modes/:mode/status     # 获取模式状态
```

**任务管理**：
```
GET    /api/projects/:id/tasks                  # 获取任务列表
GET    /api/projects/:id/tasks/:taskId          # 获取任务详情
POST   /api/projects/:id/tasks/:taskId/retry    # 重试任务
GET    /api/projects/:id/layers/:layerNum       # 获取层级状态
```

**文件操作**：
```
GET    /api/projects/:id/files                  # 获取文件树
GET    /api/projects/:id/files/*path            # 读取文件内容
POST   /api/projects/:id/files/*path            # 创建/更新文件
DELETE /api/projects/:id/files/*path            # 删除文件
```

**日志和监控**：
```
GET    /api/projects/:id/logs                   # 获取执行日志
GET    /api/projects/:id/tasks/:taskId/logs     # 获取任务日志
GET    /api/projects/:id/metrics                # 获取执行指标
```

### 6.2 WebSocket API

**连接**：
```
ws://localhost:3000/ws?projectId=<uuid>
```

**消息格式**：
```typescript
// 客户端发送
{
  "type": "execute_mode",
  "payload": {
    "mode": "prd",
    "input": "构建一个在线博客系统"
  },
  "correlationId": "req-123"
}

// 服务器响应
{
  "type": "claude_output",
  "payload": {
    "text": "正在生成PRD文档...",
    "stream": true
  },
  "correlationId": "req-123",
  "timestamp": 1705843200000
}

// 进度更新
{
  "type": "task_progress",
  "payload": {
    "projectId": "uuid",
    "currentLayer": 2,
    "totalLayers": 4,
    "currentTask": "2.1",
    "taskStatus": "running",
    "completedTasks": 5,
    "totalTasks": 10,
    "percentage": 50
  },
  "timestamp": 1705843200000
}
```

---

## 7. 安全性设计

### 7.1 认证与授权

**JWT Token 认证**：
```typescript
// 登录获取 token
POST /api/auth/login
{
  "username": "user@example.com",
  "password": "hashed_password"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpc2lzcmVmcmVzaA...",
  "expires_in": 3600
}

// 后续请求携带 token
GET /api/projects
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**WebSocket 认证**：
```typescript
// 连接时携带 token
ws://localhost:3000/ws?token=eyJhbGciOiJIUzI1NiIs...

// 服务器验证
const token = query.token;
const user = verifyJWT(token);
if (!user) {
  ws.close(4001, 'Unauthorized');
}
```

### 7.2 API 密钥管理

**环境变量加密存储**：
```typescript
// .env.encrypted (使用 AES-256 加密)
ANTHROPIC_API_KEY=encrypted:AES256:base64encodedciphertext

// 运行时解密
import { decrypt } from './crypto';
const apiKey = decrypt(process.env.ANTHROPIC_API_KEY);
```

**密钥轮换机制**：
- 定期提示用户更新 API 密钥
- 支持多个密钥并发使用（负载均衡）
- 密钥失效自动切换备用密钥

### 7.3 代码执行沙箱

**Docker 容器隔离**（可选）：
```typescript
// 在独立容器中执行 Claude 命令
const result = await dockerExec({
  image: 'claude-executor:latest',
  command: ['claude', '-p', prompt],
  limits: {
    memory: '1G',
    cpu: '1',
    timeout: 600000
  },
  volumes: {
    [projectPath]: '/workspace'
  }
});
```

**文件系统权限**：
- Claude 进程只能访问项目目录
- 禁止访问系统目录（/etc, /usr, /bin）
- 使用 chroot 或 namespace 隔离

### 7.4 输入验证

```typescript
// 防止 prompt injection
function sanitizePrompt(input: string): string {
  // 移除危险字符
  let sanitized = input.replace(/[`${}]/g, '');

  // 限制长度
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  // 检测恶意指令
  const maliciousPatterns = [
    /rm\s+-rf/i,
    /sudo/i,
    /chmod/i,
    /eval/i
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Malicious input detected');
    }
  }

  return sanitized;
}
```

---

## 8. 性能优化

### 8.1 并发控制

**任务队列（Bull）**：
```typescript
import Bull from 'bull';

const taskQueue = new Bull('claude-tasks', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// 限制并发数
taskQueue.process(10, async (job) => {
  const { taskId, prompt } = job.data;
  return await claudeExecutor.execute(prompt, { taskId });
});

// 添加任务
await taskQueue.add({
  taskId: '1.1',
  prompt: 'Initialize React project'
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});
```

### 8.2 缓存策略

**Redis 缓存层**：
```typescript
class CacheService {
  // 缓存任务结果（避免重复执行）
  async cacheTaskResult(taskId: string, result: TaskResult): Promise<void> {
    const key = `task:result:${taskId}`;
    await redis.setex(key, 3600, JSON.stringify(result)); // 1小时过期
  }

  async getCachedTaskResult(taskId: string): Promise<TaskResult | null> {
    const key = `task:result:${taskId}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 缓存 DAG 索引
  async cacheTaskIndex(projectId: string, taskIndex: TaskIndex): Promise<void> {
    const key = `project:${projectId}:task-index`;
    await redis.set(key, JSON.stringify(taskIndex));
  }
}
```

### 8.3 输出流优化

**分块传输**：
```typescript
class OutputStreamHandler {
  private buffer: string = '';
  private readonly chunkSize = 1024; // 1KB

  handleChunk(chunk: string, clientId: string): void {
    this.buffer += chunk;

    // 达到阈值或包含完整行时发送
    if (this.buffer.length >= this.chunkSize || chunk.includes('\n')) {
      this.flush(clientId);
    }
  }

  flush(clientId: string): void {
    if (this.buffer.length > 0) {
      wsManager.broadcastToClient(clientId, {
        type: 'claude_output',
        payload: { text: this.buffer, stream: true },
        timestamp: Date.now()
      });
      this.buffer = '';
    }
  }
}
```

### 8.4 数据库优化

**连接池**：
```typescript
const sequelize = new Sequelize({
  dialect: 'postgres',
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
});
```

**批量插入日志**：
```typescript
class LogBatcher {
  private batch: ExecutionLog[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5秒

  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  add(log: ExecutionLog): void {
    this.batch.push(log);
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    await ExecutionLog.bulkCreate(this.batch);
    this.batch = [];
  }
}
```

---

## 9. 监控和日志

### 9.1 日志结构

**Winston 配置**：
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'claude-harness-backend' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 使用
logger.info('Task execution started', {
  taskId: '1.1',
  projectId: 'uuid',
  layer: 1
});

logger.error('Task execution failed', {
  taskId: '1.1',
  error: error.message,
  stack: error.stack
});
```

### 9.2 性能监控

**指标收集**：
```typescript
class MetricsCollector {
  async recordTaskExecution(taskId: string, duration: number, success: boolean): Promise<void> {
    await redis.hincrby('metrics:tasks:count', taskId, 1);
    await redis.hset('metrics:tasks:duration', taskId, duration);
    await redis.hincrby('metrics:tasks:success', taskId, success ? 1 : 0);
  }

  async getMetrics(projectId: string): Promise<Metrics> {
    return {
      totalTasks: await redis.hlen(`project:${projectId}:tasks`),
      completedTasks: await redis.get(`project:${projectId}:completed`) || 0,
      averageDuration: await this.calculateAverageDuration(projectId),
      successRate: await this.calculateSuccessRate(projectId)
    };
  }
}
```

---

## 10. 部署架构

### 10.1 开发环境

```
┌─────────────────────────────────────┐
│        Developer Machine            │
│  ┌────────────────────────────────┐ │
│  │  Node.js Backend (localhost)   │ │
│  │  Port: 3000                    │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  SQLite (file-based)           │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  Redis (docker)                │ │
│  │  Port: 6379                    │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**启动命令**：
```bash
# 安装依赖
npm install

# 启动 Redis
docker run -d -p 6379:6379 redis:7-alpine

# 数据库迁移
npm run migrate

# 启动开发服务器
npm run dev
```

### 10.2 生产环境

```
┌───────────────────────────────────────────────────────┐
│                  Load Balancer (Nginx)                │
│                    Port: 80/443                       │
└─────────────┬─────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐         ┌───▼────┐
│ Node.js│         │ Node.js│
│Backend │         │Backend │
│  PM2   │         │  PM2   │
└───┬────┘         └───┬────┘
    │                  │
    └─────────┬────────┘
              │
    ┌─────────▼─────────┐
    │                   │
┌───▼────────┐   ┌─────▼─────┐
│ PostgreSQL │   │   Redis   │
│  Primary   │   │  Cluster  │
│            │   │           │
└────────────┘   └───────────┘
```

**Docker Compose**：
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://user:pass@postgres:5432/harness
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./context:/app/context
      - ./logs:/app/logs
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 4G

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: harness
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 10.3 环境变量

**.env.production**：
```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgres://user:password@postgres:5432/harness
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# Claude API
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MAX_CONCURRENT=10
CLAUDE_TIMEOUT=600000

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/app/logs

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

## 11. 故障处理和恢复

### 11.1 任务执行失败

**自动重试策略**：
```typescript
class TaskRetryHandler {
  async executeWithRetry(task: Task, maxRetries: number = 3): Promise<TaskResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Task ${task.id} attempt ${attempt}/${maxRetries}`);

        const result = await this.executeTask(task);

        // 成功则返回
        if (result.status === 'completed') {
          return result;
        }

        // 失败但可重试
        lastError = new Error(result.error);

      } catch (error) {
        lastError = error;
        logger.warn(`Task ${task.id} attempt ${attempt} failed: ${error.message}`);

        // 指数退避
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // 所有尝试失败
    throw new Error(`Task ${task.id} failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}
```

### 11.2 进程崩溃恢复

**PM2 配置**：
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'claude-harness-backend',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env: {
      NODE_ENV: 'production'
    },
    // 崩溃自动重启
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // 优雅关闭
    kill_timeout: 5000,
    listen_timeout: 3000
  }]
};
```

### 11.3 数据库事务

**任务状态更新的原子性**：
```typescript
class TaskExecutionService {
  async executeLayerWithTransaction(layer: Layer): Promise<LayerResult> {
    const transaction = await sequelize.transaction();

    try {
      // 1. 更新层级状态为 running
      await LayerExecution.update(
        { status: 'running', started_at: new Date() },
        { where: { layer_num: layer.layer_num }, transaction }
      );

      // 2. 执行所有任务
      const results = await this.executeTasksParallel(layer.tasks);

      // 3. 更新层级状态
      const failed = results.filter(r => r.status === 'failed');
      await LayerExecution.update({
        status: failed.length > 0 ? 'failed' : 'completed',
        completed_tasks: results.filter(r => r.status === 'completed').length,
        failed_tasks: failed.length,
        completed_at: new Date()
      }, { where: { layer_num: layer.layer_num }, transaction });

      // 4. 批量更新任务状态
      for (const result of results) {
        await TaskExecution.update({
          status: result.status,
          completed_at: new Date(),
          claude_output: result.output,
          error_message: result.error
        }, { where: { task_id: result.taskId }, transaction });
      }

      await transaction.commit();

      return {
        layer_num: layer.layer_num,
        status: failed.length > 0 ? 'failed' : 'completed',
        results
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

---

## 12. 测试策略

### 12.1 单元测试

```typescript
// tests/unit/dag-engine.test.ts
describe('DAGExecutionEngine', () => {
  it('should execute layers in correct order', async () => {
    const taskIndex = {
      layers: {
        '1': { tasks: [/* ... */] },
        '2': { tasks: [/* ... */] }
      }
    };

    const engine = new DAGExecutionEngine();
    const result = await engine.executeLayers(taskIndex);

    expect(result.success).toBe(true);
    expect(executionOrder).toEqual(['1.1', '1.2', '2.1', '2.2']);
  });

  it('should execute tasks in parallel within same layer', async () => {
    const layer = {
      layer_num: 1,
      tasks: [task1, task2, task3]
    };

    const startTime = Date.now();
    await engine.executeLayer(layer);
    const duration = Date.now() - startTime;

    // 并行执行时间应远小于串行
    expect(duration).toBeLessThan(SERIAL_DURATION / 2);
  });
});
```

### 12.2 集成测试

```typescript
// tests/integration/workflow.test.ts
describe('Workflow Integration', () => {
  it('should complete full workflow from PRD to deployment', async () => {
    const project = await createTestProject();

    // 1. PRD模式
    await orchestrator.executeMode('prd', testPRDInput);
    expect(fs.existsSync('context/prd/prd.md')).toBe(true);

    // 2. 架构模式
    await orchestrator.executeMode('architecture', '');
    expect(fs.existsSync('context/architecture/backend/backend-architecture.md')).toBe(true);

    // 3. 开发计划
    await orchestrator.executeMode('dev-plan', '');
    expect(fs.existsSync('context/dev-plan/backend/backend-dev-plan.md')).toBe(true);

    // 4. 任务生成
    await orchestrator.executeMode('task-generation', '');
    const taskIndex = JSON.parse(fs.readFileSync('context/dev-tasks/backend/tasks-index.json'));
    expect(taskIndex.total_tasks).toBeGreaterThan(0);

    // 5. 执行任务
    const result = await orchestrator.executeMode('execution', '');
    expect(result.success).toBe(true);
  });
});
```

---

## 13. 技术风险和缓解

### 13.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Claude API 限流 | 高 | 高 | 请求队列、速率限制、多密钥轮换 |
| 并发任务资源竞争 | 中 | 高 | 分布式锁、文件锁、隔离工作目录 |
| WebSocket 连接不稳定 | 中 | 中 | 心跳、自动重连、消息确认 |
| 任务执行超时 | 中 | 中 | 超时检测、自动终止、重试机制 |
| 数据库性能瓶颈 | 低 | 高 | 连接池、索引优化、读写分离 |
| 磁盘空间不足 | 低 | 高 | 日志轮转、定期清理、监控告警 |

### 13.2 Claude API 限流应对

```typescript
class RateLimitedClaudeExecutor {
  private queue: Queue;
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 50, // 每分钟50个请求
      interval: 'minute'
    });

    this.queue = new Bull('claude-api', {
      limiter: {
        max: 50,
        duration: 60000
      }
    });
  }

  async execute(prompt: string): Promise<ExecutionResult> {
    await this.rateLimiter.removeTokens(1);

    return await this.queue.add({ prompt }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }
}
```

---

## 14. 扩展性设计

### 14.1 插件系统

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  onModeExecute?(mode: WorkMode, input: string): Promise<void>;
  onTaskComplete?(task: Task, result: TaskResult): Promise<void>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await import(pluginPath);
    await plugin.initialize(this.createContext());
    this.plugins.set(plugin.name, plugin);
  }

  async executeHook(hook: string, ...args: any[]): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (typeof plugin[hook] === 'function') {
        await plugin[hook](...args);
      }
    }
  }
}
```

### 14.2 多租户支持

```typescript
class MultiTenantService {
  async createTenant(tenantId: string, config: TenantConfig): Promise<void> {
    // 创建租户专属数据库 schema
    await sequelize.createSchema(tenantId);

    // 创建租户目录
    fs.mkdirSync(`/data/tenants/${tenantId}`, { recursive: true });

    // 初始化租户配置
    await TenantConfig.create({
      tenant_id: tenantId,
      ...config
    });
  }

  getTenantContext(tenantId: string): TenantContext {
    return {
      dbSchema: tenantId,
      rootPath: `/data/tenants/${tenantId}`,
      redisKeyPrefix: `tenant:${tenantId}:`
    };
  }
}
```

---

## 15. 总结

### 15.1 架构优势

1. **高度模块化**：各组件职责清晰，易于维护和扩展
2. **并发执行优化**：DAG 引擎最大化并行度，显著提升效率
3. **实时响应**：WebSocket 双向通信，低延迟用户体验
4. **可靠性保证**：任务重试、事务保护、状态持久化
5. **技术栈统一**：Node.js + TypeScript，全栈技术一致

### 15.2 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 后端语言 | Node.js | 异步 I/O、进程管理、生态丰富 |
| Web 框架 | Express | 成熟稳定、中间件生态完善 |
| 数据库 | PostgreSQL | 高并发、事务支持、JSON 字段 |
| 缓存 | Redis | 高性能、发布订阅、分布式锁 |
| 任务队列 | Bull | 基于 Redis、支持优先级和重试 |
| WebSocket | ws | 原生实现、性能优异 |

### 15.3 下一步行动

**Phase 1 - 基础设施**（2周）：
- [ ] 项目初始化（TypeScript + Express）
- [ ] 数据库设计和 ORM 配置
- [ ] WebSocket Manager 实现
- [ ] 文件系统监控服务

**Phase 2 - 核心引擎**（3周）：
- [ ] Claude Code Executor 实现
- [ ] DAG Execution Engine 实现
- [ ] Workflow Orchestrator 实现
- [ ] 任务队列和并发控制

**Phase 3 - 业务逻辑**（3周）：
- [ ] 7个工作模式 Handler 实现
- [ ] Test Loop 和自动修复
- [ ] Git 集成和部署功能
- [ ] API 和 WebSocket 接口完善

**Phase 4 - 测试和优化**（2周）：
- [ ] 单元测试和集成测试
- [ ] 性能优化和压力测试
- [ ] 安全审计
- [ ] 文档完善

---

## 附录

### A. 依赖包清单

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "sequelize": "^6.33.0",
    "pg": "^8.11.3",
    "ioredis": "^5.3.2",
    "bull": "^4.11.5",
    "chokidar": "^3.5.3",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.9.0",
    "@types/express": "^4.17.20",
    "@types/ws": "^8.5.8",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.7",
    "supertest": "^6.3.3"
  }
}
```

### B. 项目目录结构

```
backend/
├── src/
│   ├── index.ts                      # 入口文件
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── models/                       # Sequelize 模型
│   │   ├── Project.ts
│   │   ├── TaskExecution.ts
│   │   ├── LayerExecution.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── WebSocketManager.ts
│   │   ├── WorkflowOrchestrator.ts
│   │   ├── DAGExecutionEngine.ts
│   │   ├── ClaudeCodeExecutor.ts
│   │   ├── FileSystemMonitor.ts
│   │   └── TestDeployManager.ts
│   ├── controllers/                  # REST API 控制器
│   │   ├── ProjectController.ts
│   │   ├── TaskController.ts
│   │   └── FileController.ts
│   ├── routes/
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── cache.ts
│   │   └── crypto.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── logs/
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

### C. 参考资料

- [Node.js 官方文档](https://nodejs.org/docs)
- [Express 文档](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [Bull 任务队列](https://optimalbits.github.io/bull/)
- [WebSocket 协议 RFC 6455](https://tools.ietf.org/html/rfc6455)
- [DAG 调度算法](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
- [Claude API 文档](https://docs.anthropic.com/)
