# Task: 实现 DAG Execution Engine（DAG 执行引擎）

## 元数据
- **Task ID**: backend-3.4
- **Layer**: 3
- **Dependencies**: [3.2, 3.3]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4]
- **Estimated Complexity**: High

## 目标
实现完整的 DAG 执行引擎，逐层执行任务，处理层级依赖，管理执行状态，实现失败重试和恢复。

## 前置条件
- DAG Parser 已实现（Task 3.2）
- Layer Executor 已实现（Task 3.3）

## 实现步骤

### 1. 创建 DAG 执行引擎
创建 `src/services/dag/DAGExecutionEngine.ts`：
```typescript
import { TaskIndex, Layer, LayerResult, TaskStatus } from '@/types/dag.types';
import { dagParser } from './DAGParser';
import { layerExecutor } from './LayerExecutor';
import logger from '@/utils/logger';

export interface DAGExecutionOptions {
  projectPath: string;
  onLayerStart?: (layerNum: number) => void;
  onLayerComplete?: (result: LayerResult) => void;
  onProgress?: (completed: number, total: number) => void;
  stopOnFailure?: boolean; // 失败时是否停止执行
}

export interface DAGExecutionResult {
  success: boolean;
  layers: LayerResult[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  duration: number;
}

export type FailureStrategy = 'abort' | 'retry' | 'skip';

export class DAGExecutionEngine {
  /**
   * 执行完整的 DAG
   */
  async executeLayers(
    taskIndexPath: string,
    options: DAGExecutionOptions
  ): Promise<DAGExecutionResult> {
    const startTime = Date.now();

    try {
      // 1. 解析任务索引
      logger.info('Parsing task index...');
      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);

      // 2. 验证 DAG
      logger.info('Validating DAG structure...');
      const validation = dagParser.validateDAG(taskIndex);

      if (!validation.valid) {
        throw new Error(`DAG validation failed:\n${validation.errors.join('\n')}`);
      }

      if (validation.warnings.length > 0) {
        logger.warn('DAG validation warnings:', validation.warnings);
      }

      // 3. 按层级排序
      const sortedLayers = this.sortLayers(taskIndex);

      logger.info(`Starting DAG execution`, {
        totalLayers: sortedLayers.length,
        totalTasks: taskIndex.total_tasks,
      });

      // 4. 逐层执行
      const layerResults: LayerResult[] = [];
      let totalCompleted = 0;
      let totalFailed = 0;

      for (const layer of sortedLayers) {
        logger.info(`\n========================================`);
        logger.info(`Executing Layer ${layer.layer_num}/${sortedLayers.length - 1}`);
        logger.info(`========================================`);

        // 触发层开始回调
        if (options.onLayerStart) {
          options.onLayerStart(layer.layer_num);
        }

        // 执行层级
        const layerResult = await layerExecutor.executeLayer(layer, options.projectPath);
        layerResults.push(layerResult);

        // 更新统计
        totalCompleted += layerResult.completedTasks;
        totalFailed += layerResult.failedTasks;

        // 触发层完成回调
        if (options.onLayerComplete) {
          options.onLayerComplete(layerResult);
        }

        // 触发进度回调
        if (options.onProgress) {
          options.onProgress(totalCompleted, taskIndex.total_tasks);
        }

        // 检查是否失败
        if (layerResult.status === 'failed') {
          logger.error(`Layer ${layer.layer_num} failed`, {
            failedTasks: layerResult.failedTasks,
            failures: layerResult.failures,
          });

          // 处理失败策略
          const strategy = await this.handleLayerFailure(layer, layerResult);

          if (strategy === 'abort' || (options.stopOnFailure && strategy !== 'retry')) {
            logger.error('Aborting DAG execution due to layer failure');
            break;
          } else if (strategy === 'retry') {
            logger.info(`Retrying Layer ${layer.layer_num}...`);
            const retryResult = await layerExecutor.executeLayer(layer, options.projectPath);
            layerResults[layerResults.length - 1] = retryResult;

            if (retryResult.status === 'failed') {
              logger.error('Layer retry failed');
              if (options.stopOnFailure) {
                break;
              }
            }
          }
          // 'skip' 策略：继续执行下一层
        }

        logger.info(`Layer ${layer.layer_num} completed`, {
          status: layerResult.status,
          completedTasks: layerResult.completedTasks,
          failedTasks: layerResult.failedTasks,
        });
      }

      // 5. 生成执行结果
      const duration = Date.now() - startTime;
      const success = layerResults.every((r) => r.status === 'completed');

      const result: DAGExecutionResult = {
        success,
        layers: layerResults,
        totalTasks: taskIndex.total_tasks,
        completedTasks: totalCompleted,
        failedTasks: totalFailed,
        duration,
      };

      logger.info('\n========================================');
      logger.info('DAG Execution Summary');
      logger.info('========================================');
      logger.info(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      logger.info(`Total Tasks: ${result.totalTasks}`);
      logger.info(`Completed: ${result.completedTasks}`);
      logger.info(`Failed: ${result.failedTasks}`);
      logger.info(`Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
      logger.info('========================================\n');

      return result;
    } catch (error) {
      logger.error('DAG execution failed:', error);
      throw error;
    }
  }

  /**
   * 排序 Layer（按 layer_num）
   */
  private sortLayers(taskIndex: TaskIndex): Layer[] {
    return Object.values(taskIndex.layers).sort((a, b) => a.layer_num - b.layer_num);
  }

  /**
   * 处理层级失败
   */
  private async handleLayerFailure(
    layer: Layer,
    layerResult: LayerResult
  ): Promise<FailureStrategy> {
    // 默认策略：失败超过 50% 的任务则终止
    const failureRate = layerResult.failedTasks / layerResult.totalTasks;

    if (failureRate > 0.5) {
      return 'abort';
    } else if (failureRate > 0) {
      // 部分失败，可以选择跳过
      return 'skip';
    }

    return 'skip';

    // 在实际应用中，这里可以：
    // 1. 询问用户如何处理
    // 2. 根据任务重要性决定
    // 3. 自动重试失败任务
  }

  /**
   * 获取执行进度
   */
  getProgress(layerResults: LayerResult[], totalTasks: number): number {
    const completedTasks = layerResults.reduce((sum, r) => sum + r.completedTasks, 0);
    return Math.round((completedTasks / totalTasks) * 100);
  }
}

export const dagExecutionEngine = new DAGExecutionEngine();
```

## 期望输出

### 新增文件
- `src/services/dag/DAGExecutionEngine.ts`

### DAG 执行引擎功能
- 执行完整的 DAG
- 逐层执行（顺序）
- 失败处理策略
- 进度跟踪
- 执行统计

## 验证标准

### 1. 完整 DAG 执行验证
```typescript
import { dagExecutionEngine } from '@/services/dag/DAGExecutionEngine';

const result = await dagExecutionEngine.executeLayers(
  './context/dev-tasks/backend/tasks-index.json',
  {
    projectPath: process.cwd(),
    onLayerStart: (layerNum) => {
      console.log(`Starting Layer ${layerNum}`);
    },
    onLayerComplete: (result) => {
      console.log(`Layer ${result.layer_num} completed:`, result.status);
    },
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
    stopOnFailure: true,
  }
);

console.log('DAG execution result:', result);
```

### 2. 失败处理验证
创建一个会失败的任务，验证失败策略

### 3. 进度追踪验证
验证进度回调正确触发

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/services/dag/DAGExecutionEngine.ts，实现 DAGExecutionEngine 类：
   - executeLayers()：执行完整的DAG
     * 解析任务索引
     * 验证 DAG 结构
     * 排序 Layer
     * 逐层执行（for...of 循环）
     * 触发回调（onLayerStart, onLayerComplete, onProgress）
     * 处理失败策略
     * 生成执行结果
   - sortLayers()：按 layer_num 排序
   - handleLayerFailure()：失败策略决策
   - getProgress()：计算进度百分比

2. 定义接口：
   - DAGExecutionOptions
   - DAGExecutionResult
   - FailureStrategy 类型

3. 导出单例 dagExecutionEngine

4. 验证 DAG 执行引擎：
   - 执行完整的 tasks-index.json
   - 验证逐层执行
   - 验证进度跟踪
   - 测试失败处理

确保 DAG 执行引擎完整、逐层执行正确、失败处理合理。
