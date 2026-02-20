# Task: 实现 Layer Executor（层级执行器）

## 元数据
- **Task ID**: backend-3.3
- **Layer**: 3
- **Dependencies**: [3.1, 3.2, 2.7]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4]
- **Estimated Complexity**: High

## 目标
实现层级执行器，负责执行单个Layer内的所有任务，支持并行执行、进度跟踪、失败处理。

## 前置条件
- Claude Executor 已实现（Task 3.1）
- DAG Parser 已实现（Task 3.2）
- Bull 任务队列已配置（Task 2.7）

## 实现步骤

### 1. 创建层级执行器
创建 `src/services/dag/LayerExecutor.ts`：
```typescript
import { Layer, Task, TaskResult, LayerResult, TaskStatus } from '@/types/dag.types';
import { claudeCodeExecutor } from '@/services/ClaudeCodeExecutor';
import { queueService } from '@/services/queue.service';
import logger from '@/utils/logger';
import fs from 'fs/promises';
import path from 'path';

export class LayerExecutor {
  /**
   * 执行整个 Layer（并行执行所有任务）
   */
  async executeLayer(layer: Layer, projectPath: string): Promise<LayerResult> {
    const startTime = Date.now();

    logger.info(`Executing Layer ${layer.layer_num}`, {
      totalTasks: layer.tasks.length,
      parallel: layer.parallel,
    });

    let taskResults: TaskResult[];

    if (layer.parallel && layer.tasks.length > 1) {
      // 并行执行
      taskResults = await this.executeTasksParallel(layer.tasks, projectPath);
    } else {
      // 串行执行
      taskResults = await this.executeTasksSequential(layer.tasks, projectPath);
    }

    // 统计结果
    const completed = taskResults.filter((r) => r.status === 'completed');
    const failed = taskResults.filter((r) => r.status === 'failed');

    const duration = Date.now() - startTime;

    const layerResult: LayerResult = {
      layer_num: layer.layer_num,
      status: failed.length === 0 ? 'completed' : 'failed',
      totalTasks: layer.tasks.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      failures: failed,
      duration,
    };

    logger.info(`Layer ${layer.layer_num} execution completed`, {
      status: layerResult.status,
      completed: completed.length,
      failed: failed.length,
      duration: `${(duration / 1000).toFixed(2)}s`,
    });

    return layerResult;
  }

  /**
   * 并行执行任务
   */
  private async executeTasksParallel(tasks: Task[], projectPath: string): Promise<TaskResult[]> {
    logger.info(`Executing ${tasks.length} tasks in parallel`);

    const promises = tasks.map((task) => this.executeTask(task, projectPath));

    return await Promise.all(promises);
  }

  /**
   * 串行执行任务
   */
  private async executeTasksSequential(tasks: Task[], projectPath: string): Promise<TaskResult[]> {
    logger.info(`Executing ${tasks.length} tasks sequentially`);

    const results: TaskResult[] = [];

    for (const task of tasks) {
      const result = await this.executeTask(task, projectPath);
      results.push(result);

      // 如果任务失败，可以选择是否继续
      if (result.status === 'failed') {
        logger.warn(`Task ${task.id} failed in sequential execution`);
        // 这里可以添加"失败即停止"的逻辑
      }
    }

    return results;
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: Task, projectPath: string): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      logger.info(`Starting task ${task.id}: ${task.name}`);

      // 1. 读取任务文档
      const taskFilePath = path.join(projectPath, 'context/dev-tasks/backend', task.file);
      const taskContent = await fs.readFile(taskFilePath, 'utf-8');

      // 2. 提取 Claude 执行 Prompt
      const prompt = this.extractClaudePrompt(taskContent);

      if (!prompt) {
        throw new Error(`No Claude prompt found in task file: ${task.file}`);
      }

      // 3. 执行 Claude
      const result = await claudeCodeExecutor.execute(prompt, {
        taskId: task.id,
        workingDir: projectPath,
        timeout: 600000, // 10 分钟
        onProgress: (output) => {
          logger.debug(`Task ${task.id} progress:`, output.substring(0, 100));
        },
      });

      // 4. 验证输出（基础验证）
      const validation = this.validateTaskOutput(task, result.output);

      const duration = Date.now() - startTime;

      const taskResult: TaskResult = {
        taskId: task.id,
        status: validation.success && result.success ? 'completed' : 'failed',
        output: result.output,
        validation,
        duration,
        error: result.error || validation.error,
      };

      if (taskResult.status === 'completed') {
        logger.info(`Task ${task.id} completed successfully`, {
          duration: `${(duration / 1000).toFixed(2)}s`,
        });
      } else {
        logger.error(`Task ${task.id} failed`, {
          error: taskResult.error,
          duration: `${(duration / 1000).toFixed(2)}s`,
        });
      }

      return taskResult;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Task ${task.id} execution error:`, error);

      return {
        taskId: task.id,
        status: 'failed',
        output: '',
        error: error.message,
        duration,
      };
    }
  }

  /**
   * 从任务文档中提取 Claude 执行 Prompt
   */
  private extractClaudePrompt(taskContent: string): string | null {
    // 查找 "## Claude 执行 Prompt" 部分
    const promptSection = taskContent.match(/## Claude 执行 Prompt\s+([\s\S]+?)(?=\n##|\n---|\n```|$)/);

    if (!promptSection) {
      return null;
    }

    return promptSection[1].trim();
  }

  /**
   * 验证任务输出（基础验证）
   */
  private validateTaskOutput(task: Task, output: string): { success: boolean; error?: string } {
    // 基础验证：检查输出不为空
    if (!output || output.trim().length === 0) {
      return {
        success: false,
        error: 'Task produced no output',
      };
    }

    // 检查是否包含错误关键词
    const errorPatterns = [
      /error:/i,
      /failed:/i,
      /exception:/i,
      /cannot find/i,
      /not found/i,
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(output)) {
        // 注意：这只是一个简单的检测，可能有误报
        // 实际应该更智能地分析输出
      }
    }

    // 更复杂的验证可以在这里添加
    // 例如：检查期望的文件是否被创建、代码是否编译等

    return { success: true };
  }
}

export const layerExecutor = new LayerExecutor();
```

## 期望输出

### 新增文件
- `src/services/dag/LayerExecutor.ts`

### 层级执行功能
- 执行整个 Layer（并行/串行）
- 执行单个任务
- 提取 Claude Prompt
- 验证任务输出
- 进度跟踪

## 验证标准

### 1. 层级执行验证
```typescript
import { layerExecutor } from '@/services/dag/LayerExecutor';
import { Layer } from '@/types/dag.types';

const testLayer: Layer = {
  layer_num: 0,
  depends_on: [],
  tasks: [
    {
      id: '0.1',
      file: 'backend-dev-plan-0.1-init-nodejs-typescript.md',
      name: 'Test Task',
      description: 'Test',
      dependencies: [],
      status: 'pending',
    },
  ],
  parallel: false,
  status: 'pending',
};

const result = await layerExecutor.executeLayer(testLayer, '/path/to/project');

console.log('Layer result:', result);
```

### 2. 并行执行验证
测试包含多个任务的 Layer，验证并行执行

### 3. 失败处理验证
测试任务失败时的处理逻辑

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/services/dag/LayerExecutor.ts，实现 LayerExecutor 类：
   - executeLayer()：执行整个Layer
     * 支持并行和串行执行
     * 记录开始时间
     * 统计结果
     * 返回 LayerResult
   - executeTasksParallel()：并行执行多个任务（Promise.all）
   - executeTasksSequential()：串行执行任务（for...of）
   - executeTask()：执行单个任务
     * 读取任务文档文件
     * 提取 Claude Prompt
     * 调用 claudeCodeExecutor
     * 验证输出
     * 返回 TaskResult
   - extractClaudePrompt()：从Markdown文档提取Prompt（正则匹配）
   - validateTaskOutput()：基础输出验证

2. 导出单例 layerExecutor

3. 验证层级执行器：
   - 创建测试 Layer
   - 执行单个任务
   - 执行多个任务（并行）
   - 验证结果统计

确保层级执行器完整、并行执行正确、错误处理完善。
