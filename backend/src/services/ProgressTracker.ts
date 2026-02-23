import { TaskExecution, LayerExecution, Project } from '@/models';
import { WebSocketManager } from './websocket/WebSocketManager';
import { TaskProgressMessage } from '@/types/websocket.types';
import logger from '@/utils/logger';

/**
 * Progress Tracker
 * 负责跟踪 DAG 执行进度，计算百分比，通过 WebSocket 推送实时更新
 */
export class ProgressTracker {
  constructor(private wsManager: WebSocketManager) {
    logger.info('ProgressTracker initialized');
  }

  /**
   * 更新任务进度
   * @param projectId 项目 ID
   * @param taskId 任务 ID
   * @param status 任务状态
   */
  async updateTaskProgress(
    projectId: string,
    taskId: string,
    status: string
  ): Promise<void> {
    try {
      // 更新数据库中的任务状态
      const [updatedCount] = await TaskExecution.update(
        { status },
        { where: { project_id: projectId, task_id: taskId } }
      );

      if (updatedCount === 0) {
        logger.warn(`Task ${taskId} not found for project ${projectId}`);
        return;
      }

      logger.debug(`Task ${taskId} status updated to ${status}`, { projectId });

      // 计算项目进度
      const progress = await this.calculateProgress(projectId);

      // 推送 WebSocket 消息到项目房间
      const message = {
        type: 'task_progress' as const,
        payload: progress,
        timestamp: Date.now(),
      };

      this.wsManager.broadcastToRoom(`project:${projectId}`, message);

      logger.info(`Progress update sent for project ${projectId}`, {
        currentTask: taskId,
        percentage: progress.percentage,
      });
    } catch (error) {
      logger.error(`Failed to update task progress for ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 更新层级进度
   * @param projectId 项目 ID
   * @param layerNum 层级编号
   * @param status 层级状态
   */
  async updateLayerProgress(
    projectId: string,
    layerNum: number,
    status: string
  ): Promise<void> {
    try {
      // 计算层级内的完成和失败任务数
      const completedTasks = await TaskExecution.count({
        where: {
          project_id: projectId,
          layer_num: layerNum,
          status: 'completed',
        },
      });

      const failedTasks = await TaskExecution.count({
        where: {
          project_id: projectId,
          layer_num: layerNum,
          status: 'failed',
        },
      });

      // 更新层级执行记录
      await LayerExecution.update(
        {
          status,
          completed_tasks: completedTasks,
          failed_tasks: failedTasks,
        },
        {
          where: {
            project_id: projectId,
            layer_num: layerNum,
          },
        }
      );

      logger.info(`Layer ${layerNum} progress updated for project ${projectId}`, {
        status,
        completedTasks,
        failedTasks,
      });

      // 同时更新整体进度
      await this.calculateProgress(projectId);
    } catch (error) {
      logger.error(`Failed to update layer progress for layer ${layerNum}:`, error);
      throw error;
    }
  }

  /**
   * 计算项目进度
   * @param projectId 项目 ID
   * @returns 进度信息
   */
  private async calculateProgress(projectId: string) {
    try {
      // 获取所有任务统计
      const totalTasks = await TaskExecution.count({
        where: { project_id: projectId },
      });

      const completedTasks = await TaskExecution.count({
        where: { project_id: projectId, status: 'completed' },
      });

      const failedTasks = await TaskExecution.count({
        where: { project_id: projectId, status: 'failed' },
      });

      const runningTasks = await TaskExecution.count({
        where: { project_id: projectId, status: 'running' },
      });

      // 获取当前执行的任务
      const currentTaskExecution = await TaskExecution.findOne({
        where: { project_id: projectId, status: 'running' },
        order: [['started_at', 'DESC']],
      });

      // 获取当前层级信息
      const currentLayerExecution = currentTaskExecution
        ? await LayerExecution.findOne({
            where: {
              project_id: projectId,
              layer_num: currentTaskExecution.layer_num,
            },
          })
        : null;

      // 获取总层级数
      const totalLayers = await LayerExecution.count({
        where: { project_id: projectId },
      });

      const completedLayers = await LayerExecution.count({
        where: { project_id: projectId, status: 'completed' },
      });

      // 计算完成百分比
      const percentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const progress = {
        projectId,
        currentLayer: currentLayerExecution?.layer_num || 0,
        totalLayers,
        currentTask: currentTaskExecution?.task_id || '',
        taskStatus: currentTaskExecution?.status || 'pending',
        completedTasks,
        totalTasks,
        percentage,
      };

      logger.debug(`Progress calculated for project ${projectId}`, progress);

      return progress;
    } catch (error) {
      logger.error(`Failed to calculate progress for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目进度（公开方法）
   * @param projectId 项目 ID
   * @returns 进度信息
   */
  async getProgress(projectId: string) {
    return this.calculateProgress(projectId);
  }

  /**
   * 重置项目进度
   * @param projectId 项目 ID
   */
  async resetProgress(projectId: string): Promise<void> {
    try {
      // 重置所有任务状态为 pending
      await TaskExecution.update(
        {
          status: 'pending',
          started_at: null,
          completed_at: null,
          duration_ms: null,
          error_message: null,
        },
        {
          where: { project_id: projectId },
        }
      );

      // 重置所有层级状态
      await LayerExecution.update(
        {
          status: 'pending',
          completed_tasks: 0,
          failed_tasks: 0,
          started_at: null,
          completed_at: null,
          duration_ms: null,
        },
        {
          where: { project_id: projectId },
        }
      );

      logger.info(`Progress reset for project ${projectId}`);

      // 推送重置后的进度
      const progress = await this.calculateProgress(projectId);
      const message = {
        type: 'task_progress' as const,
        payload: progress,
        timestamp: Date.now(),
      };

      this.wsManager.broadcastToRoom(`project:${projectId}`, message);
    } catch (error) {
      logger.error(`Failed to reset progress for project ${projectId}:`, error);
      throw error;
    }
  }
}
