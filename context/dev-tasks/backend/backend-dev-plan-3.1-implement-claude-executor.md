# Task: 实现 Claude Code Executor（进程执行器）

## 元数据
- **Task ID**: backend-3.1
- **Layer**: 3
- **Dependencies**: [2.3, 1.3]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4]
- **Estimated Complexity**: High

## 目标
实现 Claude Code CLI (`claude -p`) 进程管理器，包括进程生命周期管理、输出流捕获、超时控制和并发执行控制。

## 前置条件
- TypeScript 类型已定义（Task 2.3）
- 日志系统已配置（Task 1.3）
- Node.js 项目基础已就绪

## 实现步骤

### 1. 创建执行器接口
创建 `src/services/ClaudeCodeExecutor.ts`：
```typescript
import { spawn, ChildProcess } from 'child_process';
import logger from '@/utils/logger';
import { config } from '@/config/env';

export interface ExecutionOptions {
  taskId?: string;
  timeout?: number;
  maxRetries?: number;
  workingDir?: string;
  env?: Record<string, string>;
  onProgress?: (output: string) => void;
  onError?: (error: Error) => void;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  retries: number;
}

export class ClaudeCodeExecutor {
  private processPool: Map<string, ChildProcess> = new Map();

  async execute(prompt: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    // 实现执行逻辑
  }

  private executeOnce(prompt: string, options: ExecutionOptions): Promise<{output: string}> {
    // 实现单次执行
  }

  async shutdown(): Promise<void> {
    // 优雅关闭所有进程
  }
}

export const claudeCodeExecutor = new ClaudeCodeExecutor();
```

### 2. 实现进程管理
- spawn() 调用 `claude -p`
- 进程池管理（最多10个并发）
- 超时检测和终止

### 3. 实现输出捕获
- stdout 实时捕获
- stderr 错误收集
- 流式回调通知

### 4. 实现重试机制
- 最多3次重试
- 指数退避策略
- 错误分类处理

## 期望输出
- `src/services/ClaudeCodeExecutor.ts`
- 完整的执行器实现
- 进程池管理
- 输出流处理

## 验证标准

```typescript
const result = await claudeCodeExecutor.execute('Test prompt', {
  taskId: 'test-1',
  onProgress: (output) => console.log(output)
});

expect(result.success).toBe(true);
expect(result.output).toBeDefined();
```

## Claude 执行 Prompt

请实现 Claude Code 进程执行器：

1. 创建 src/services/ClaudeCodeExecutor.ts
2. 定义 ExecutionOptions 和 ExecutionResult 接口
3. 实现 ClaudeCodeExecutor 类，包含：
   - execute() 方法：执行 claude -p 命令
   - executeOnce() 私有方法：单次执行逻辑
   - 进程池管理（processPool Map）
   - 输出流捕获（stdout/stderr）
   - 超时控制（默认10分钟）
   - 自动重试（最多3次，指数退避）
   - shutdown() 方法：优雅关闭所有进程
4. 实现实时进度回调（onProgress）
5. 导出单例 claudeCodeExecutor

参考 backend-architecture.md 第 4.4 节的详细设计。
