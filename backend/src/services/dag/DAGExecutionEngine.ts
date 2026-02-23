import { TaskIndex, Layer, LayerResult, TaskStatus } from '../../types/dag.types';
import { dagParser } from './DAGParser';
import { layerExecutor } from './LayerExecutor';
import logger from '../../utils/logger';

export interface DAGExecutionOptions {
  projectPath: string;
  onLayerStart?: (layerNum: number) => void;
  onLayerComplete?: (result: LayerResult) => void;
  onProgress?: (completed: number, total: number) => void;
  stopOnFailure?: boolean;
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
  async executeLayers(
    taskIndexPath: string,
    options: DAGExecutionOptions
  ): Promise<DAGExecutionResult> {
    const startTime = Date.now();

    try {
      logger.info('Parsing task index...');
      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);

      logger.info('Validating DAG structure...');
      const validation = dagParser.validateDAG(taskIndex);

      if (!validation.valid) {
        throw new Error(`DAG validation failed:\n${validation.errors.join('\n')}`);
      }

      if (validation.warnings.length > 0) {
        logger.warn('DAG validation warnings:', validation.warnings);
      }

      const sortedLayers = this.sortLayers(taskIndex);

      logger.info(`Starting DAG execution`, {
        totalLayers: sortedLayers.length,
        totalTasks: taskIndex.total_tasks,
      });

      const layerResults: LayerResult[] = [];
      let totalCompleted = 0;
      let totalFailed = 0;

      for (const layer of sortedLayers) {
        logger.info(`\n========================================`);
        logger.info(`Executing Layer ${layer.layer_num}/${sortedLayers.length - 1}`);
        logger.info(`========================================`);

        if (options.onLayerStart) {
          options.onLayerStart(layer.layer_num);
        }

        const layerResult = await layerExecutor.executeLayer(layer, options.projectPath);
        layerResults.push(layerResult);

        totalCompleted += layerResult.completedTasks;
        totalFailed += layerResult.failedTasks;

        if (options.onLayerComplete) {
          options.onLayerComplete(layerResult);
        }

        if (options.onProgress) {
          options.onProgress(totalCompleted, taskIndex.total_tasks);
        }

        if (layerResult.status === 'failed') {
          logger.error(`Layer ${layer.layer_num} failed`, {
            failedTasks: layerResult.failedTasks,
            failures: layerResult.failures,
          });

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
        }

        logger.info(`Layer ${layer.layer_num} completed`, {
          status: layerResult.status,
          completedTasks: layerResult.completedTasks,
          failedTasks: layerResult.failedTasks,
        });
      }

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
    } catch (error: any) {
      logger.error('DAG execution failed:', error);
      throw error;
    }
  }

  private sortLayers(taskIndex: TaskIndex): Layer[] {
    return Object.values(taskIndex.layers).sort((a, b) => a.layer_num - b.layer_num);
  }

  private async handleLayerFailure(
    layer: Layer,
    layerResult: LayerResult
  ): Promise<FailureStrategy> {
    const failureRate = layerResult.failedTasks / layerResult.totalTasks;

    if (failureRate > 0.5) {
      return 'abort';
    } else if (failureRate > 0) {
      return 'skip';
    }

    return 'skip';
  }

  getProgress(layerResults: LayerResult[], totalTasks: number): number {
    const completedTasks = layerResults.reduce((sum, r) => sum + r.completedTasks, 0);
    return Math.round((completedTasks / totalTasks) * 100);
  }
}

export const dagExecutionEngine = new DAGExecutionEngine();
