# Task: 实现 DAG Parser（DAG 解析器）

## 元数据
- **Task ID**: backend-3.2
- **Layer**: 3
- **Dependencies**: [2.3]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4]
- **Estimated Complexity**: High

## 目标
实现 DAG（有向无环图）解析器，解析 tasks-index.json，验证DAG结构合法性，检测循环依赖，构建依赖图。

## 前置条件
- TypeScript 类型已定义（Task 2.3）

## 实现步骤

### 1. 创建 DAG 解析器
创建 `src/services/dag/DAGParser.ts`：
```typescript
import fs from 'fs/promises';
import path from 'path';
import logger from '@/utils/logger';
import { TaskIndex, Task, Layer } from '@/types/dag.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class DAGParser {
  /**
   * 解析 tasks-index.json 文件
   */
  async parseTaskIndex(filePath: string): Promise<TaskIndex> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const taskIndex: TaskIndex = JSON.parse(content);

      logger.info(`Parsed task index: ${taskIndex.total_tasks} tasks, ${taskIndex.total_layers} layers`);

      return taskIndex;
    } catch (error) {
      logger.error(`Failed to parse task index from ${filePath}:`, error);
      throw new Error(`Failed to parse task index: ${error.message}`);
    }
  }

  /**
   * 验证 DAG 结构
   */
  validateDAG(taskIndex: TaskIndex): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 验证层级顺序
    const layerNums = Object.keys(taskIndex.layers).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < layerNums.length; i++) {
      if (layerNums[i] !== i) {
        errors.push(`Layer numbers must be sequential starting from 0, found ${layerNums[i]} at index ${i}`);
      }
    }

    // 2. 验证任务依赖
    const allTaskIds = new Set<string>();
    Object.values(taskIndex.layers).forEach((layer) => {
      layer.tasks.forEach((task) => {
        allTaskIds.add(task.id);
      });
    });

    Object.values(taskIndex.layers).forEach((layer) => {
      layer.tasks.forEach((task) => {
        task.dependencies.forEach((depId) => {
          if (!allTaskIds.has(depId)) {
            errors.push(`Task ${task.id} depends on non-existent task ${depId}`);
          }
        });
      });
    });

    // 3. 检测循环依赖
    const cycleCheck = this.detectCycles(taskIndex);
    if (cycleCheck.hasCycle) {
      errors.push(`Circular dependency detected: ${cycleCheck.cycle.join(' -> ')}`);
    }

    // 4. 验证层级依赖
    Object.values(taskIndex.layers).forEach((layer) => {
      const layerNum = layer.layer_num;

      layer.tasks.forEach((task) => {
        task.dependencies.forEach((depId) => {
          const depTask = this.findTask(taskIndex, depId);

          if (depTask) {
            const depLayer = this.findLayerByTask(taskIndex, depTask);

            if (depLayer && depLayer.layer_num >= layerNum) {
              errors.push(
                `Task ${task.id} in layer ${layerNum} depends on task ${depId} in layer ${depLayer.layer_num} (must depend on earlier layers)`
              );
            }
          }
        });
      });
    });

    // 5. 验证并行标志
    Object.values(taskIndex.layers).forEach((layer) => {
      if (layer.tasks.length > 1 && !layer.parallel) {
        warnings.push(
          `Layer ${layer.layer_num} has ${layer.tasks.length} tasks but parallel is false`
        );
      }
    });

    const valid = errors.length === 0;

    if (valid) {
      logger.info('DAG validation passed', {
        warnings: warnings.length,
      });
    } else {
      logger.error('DAG validation failed', {
        errors: errors.length,
        warnings: warnings.length,
      });
    }

    return { valid, errors, warnings };
  }

  /**
   * 检测循环依赖（DFS）
   */
  private detectCycles(taskIndex: TaskIndex): { hasCycle: boolean; cycle: string[] } {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const parent = new Map<string, string>();

    const allTasks = new Map<string, Task>();
    Object.values(taskIndex.layers).forEach((layer) => {
      layer.tasks.forEach((task) => {
        allTasks.set(task.id, task);
      });
    });

    const dfs = (taskId: string): boolean => {
      visited.add(taskId);
      recStack.add(taskId);

      const task = allTasks.get(taskId);
      if (!task) return false;

      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          parent.set(depId, taskId);

          if (dfs(depId)) {
            return true;
          }
        } else if (recStack.has(depId)) {
          // 找到循环
          const cycle: string[] = [depId];
          let current = taskId;

          while (current !== depId && parent.has(current)) {
            cycle.push(current);
            current = parent.get(current)!;
          }

          cycle.push(depId);
          return true;
        }
      }

      recStack.delete(taskId);
      return false;
    };

    // 检查所有任务
    for (const taskId of allTasks.keys()) {
      if (!visited.has(taskId)) {
        if (dfs(taskId)) {
          return { hasCycle: true, cycle: [] }; // 简化返回
        }
      }
    }

    return { hasCycle: false, cycle: [] };
  }

  /**
   * 查找任务
   */
  private findTask(taskIndex: TaskIndex, taskId: string): Task | null {
    for (const layer of Object.values(taskIndex.layers)) {
      const task = layer.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  /**
   * 查找任务所在层级
   */
  private findLayerByTask(taskIndex: TaskIndex, task: Task): Layer | null {
    for (const layer of Object.values(taskIndex.layers)) {
      if (layer.tasks.some((t) => t.id === task.id)) {
        return layer;
      }
    }
    return null;
  }

  /**
   * 获取任务的所有依赖（递归）
   */
  getAllDependencies(taskIndex: TaskIndex, taskId: string): Set<string> {
    const dependencies = new Set<string>();
    const task = this.findTask(taskIndex, taskId);

    if (!task) return dependencies;

    const traverse = (currentTaskId: string) => {
      const currentTask = this.findTask(taskIndex, currentTaskId);
      if (!currentTask) return;

      currentTask.dependencies.forEach((depId) => {
        if (!dependencies.has(depId)) {
          dependencies.add(depId);
          traverse(depId);
        }
      });
    };

    traverse(taskId);
    return dependencies;
  }

  /**
   * 构建依赖图（邻接表）
   */
  buildDependencyGraph(taskIndex: TaskIndex): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    Object.values(taskIndex.layers).forEach((layer) => {
      layer.tasks.forEach((task) => {
        if (!graph.has(task.id)) {
          graph.set(task.id, new Set());
        }

        task.dependencies.forEach((depId) => {
          graph.get(task.id)!.add(depId);
        });
      });
    });

    return graph;
  }
}

export const dagParser = new DAGParser();
```

## 期望输出

### 新增文件
- `src/services/dag/DAGParser.ts`

### DAG 解析功能
- 解析 tasks-index.json
- 验证 DAG 结构（层级、依赖）
- 检测循环依赖（DFS算法）
- 构建依赖图
- 获取任务的所有依赖

## 验证标准

### 1. 解析任务索引
```typescript
import { dagParser } from '@/services/dag/DAGParser';

const taskIndex = await dagParser.parseTaskIndex('./context/dev-tasks/backend/tasks-index.json');

console.log('Total tasks:', taskIndex.total_tasks);
console.log('Total layers:', taskIndex.total_layers);
```

### 2. 验证 DAG
```typescript
const validation = dagParser.validateDAG(taskIndex);

console.log('Valid:', validation.valid);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
```

### 3. 检测循环依赖
创建一个有循环依赖的测试索引，验证能正确检测

### 4. 构建依赖图
```typescript
const graph = dagParser.buildDependencyGraph(taskIndex);

console.log('Dependency graph:', graph);
```

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/services/dag/ 目录

2. 创建 src/services/dag/DAGParser.ts，实现 DAGParser 类：
   - parseTaskIndex()：解析 JSON 文件
   - validateDAG()：验证 DAG 结构
     * 验证层级顺序
     * 验证任务依赖存在
     * 检测循环依赖
     * 验证层级依赖正确性
     * 验证并行标志
   - detectCycles()：使用 DFS 检测循环依赖
   - findTask()：查找任务
   - findLayerByTask()：查找任务所在层级
   - getAllDependencies()：递归获取所有依赖
   - buildDependencyGraph()：构建邻接表

3. 定义 ValidationResult 接口

4. 导出单例 dagParser

5. 验证 DAG 解析器：
   - 解析 tasks-index.json
   - 验证 DAG 结构
   - 测试循环依赖检测
   - 构建依赖图

确保 DAG 解析器完整、验证严格、算法正确。
