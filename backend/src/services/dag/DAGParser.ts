import fs from 'fs/promises';
import logger from '../../utils/logger';
import { TaskIndex, Task, Layer } from '../../types/dag.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class DAGParser {
  async parseTaskIndex(filePath: string): Promise<TaskIndex> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const taskIndex: TaskIndex = JSON.parse(content);
      logger.info(`Parsed task index: ${taskIndex.total_tasks} tasks, ${taskIndex.total_layers} layers`);
      return taskIndex;
    } catch (error: any) {
      logger.error(`Failed to parse task index from ${filePath}:`, error);
      throw new Error(`Failed to parse task index: ${error.message}`);
    }
  }

  validateDAG(taskIndex: TaskIndex): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const layerNums = Object.keys(taskIndex.layers).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < layerNums.length; i++) {
      if (layerNums[i] !== i) {
        errors.push(`Layer numbers must be sequential starting from 0, found ${layerNums[i]} at index ${i}`);
      }
    }
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
    const cycleCheck = this.detectCycles(taskIndex);
    if (cycleCheck.hasCycle) {
      errors.push('Circular dependency detected');
    }
    Object.values(taskIndex.layers).forEach((layer) => {
      const layerNum = layer.layer_num;
      layer.tasks.forEach((task) => {
        task.dependencies.forEach((depId) => {
          const depTask = this.findTask(taskIndex, depId);
          if (depTask) {
            const depLayer = this.findLayerByTask(taskIndex, depTask);
            if (depLayer && depLayer.layer_num >= layerNum) {
              errors.push(`Task ${task.id} in layer ${layerNum} depends on task ${depId} in layer ${depLayer.layer_num}`);
            }
          }
        });
      });
    });
    Object.values(taskIndex.layers).forEach((layer) => {
      if (layer.tasks.length > 1 && !layer.parallel) {
        warnings.push(`Layer ${layer.layer_num} has ${layer.tasks.length} tasks but parallel is false`);
      }
    });
    const valid = errors.length === 0;
    if (valid) {
      logger.info('DAG validation passed', { warnings: warnings.length });
    } else {
      logger.error('DAG validation failed', { errors: errors.length, warnings: warnings.length });
    }
    return { valid, errors, warnings };
  }

  private detectCycles(taskIndex: TaskIndex): { hasCycle: boolean; cycle: string[] } {
    const visited = new Set<string>();
    const recStack = new Set<string>();
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
          if (dfs(depId)) return true;
        } else if (recStack.has(depId)) {
          return true;
        }
      }
      recStack.delete(taskId);
      return false;
    };
    for (const taskId of allTasks.keys()) {
      if (!visited.has(taskId)) {
        if (dfs(taskId)) {
          return { hasCycle: true, cycle: [] };
        }
      }
    }
    return { hasCycle: false, cycle: [] };
  }

  private findTask(taskIndex: TaskIndex, taskId: string): Task | null {
    for (const layer of Object.values(taskIndex.layers)) {
      const task = layer.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  private findLayerByTask(taskIndex: TaskIndex, task: Task): Layer | null {
    for (const layer of Object.values(taskIndex.layers)) {
      if (layer.tasks.some((t) => t.id === task.id)) {
        return layer;
      }
    }
    return null;
  }

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
