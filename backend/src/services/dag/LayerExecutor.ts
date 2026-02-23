import { Layer, Task, TaskResult, LayerResult, TaskStatus } from '../../types/dag.types';
import { claudeCodeExecutor } from '../ClaudeCodeExecutor';
import logger from '../../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export class LayerExecutor {
  async executeLayer(layer: Layer, projectPath: string): Promise<LayerResult> {
    const startTime = Date.now();
    logger.info(`Executing Layer ${layer.layer_num}`, {
      totalTasks: layer.tasks.length,
      parallel: layer.parallel,
    });
    let taskResults: TaskResult[];
    if (layer.parallel && layer.tasks.length > 1) {
      taskResults = await this.executeTasksParallel(layer.tasks, projectPath);
    } else {
      taskResults = await this.executeTasksSequential(layer.tasks, projectPath);
    }
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

  private async executeTasksParallel(tasks: Task[], projectPath: string): Promise<TaskResult[]> {
    logger.info(`Executing ${tasks.length} tasks in parallel`);
    const promises = tasks.map((task) => this.executeTask(task, projectPath));
    return await Promise.all(promises);
  }

  private async executeTasksSequential(tasks: Task[], projectPath: string): Promise<TaskResult[]> {
    logger.info(`Executing ${tasks.length} tasks sequentially`);
    const results: TaskResult[] = [];
    for (const task of tasks) {
      const result = await this.executeTask(task, projectPath);
      results.push(result);
      if (result.status === 'failed') {
        logger.warn(`Task ${task.id} failed in sequential execution`);
      }
    }
    return results;
  }

  private async executeTask(task: Task, projectPath: string): Promise<TaskResult> {
    const startTime = Date.now();
    try {
      logger.info(`Starting task ${task.id}: ${task.name}`);
      const taskFilePath = path.join(projectPath, 'context/dev-tasks/backend', task.file);
      const taskContent = await fs.readFile(taskFilePath, 'utf-8');
      const prompt = this.extractClaudePrompt(taskContent);
      if (!prompt) {
        throw new Error(`No Claude prompt found in task file: ${task.file}`);
      }
      const result = await claudeCodeExecutor.execute(prompt, {
        taskId: task.id,
        workingDir: projectPath,
        timeout: 600000,
        onProgress: (output) => {
          logger.debug(`Task ${task.id} progress:`, output.substring(0, 100));
        },
      });
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
    } catch (error: any) {
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

  private extractClaudePrompt(taskContent: string): string | null {
    const promptSection = taskContent.match(/## Claude 执行 Prompt\s+([\s\S]+?)(?=\n##|\n---|\n```|$)/);
    if (!promptSection) {
      return null;
    }
    return promptSection[1].trim();
  }

  private validateTaskOutput(task: Task, output: string): { success: boolean; error?: string } {
    if (!output || output.trim().length === 0) {
      return {
        success: false,
        error: 'Task produced no output',
      };
    }
    return { success: true };
  }
}

export const layerExecutor = new LayerExecutor();
