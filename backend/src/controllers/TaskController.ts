import { Request, Response } from 'express';
import { TaskExecution, Project, ExecutionLog } from '../models';
import logger from '../utils/logger';

/**
 * TaskController
 * 处理任务相关的 API 请求
 */
export class TaskController {
  /**
   * 列出项目的所有任务
   * GET /api/projects/:projectId/tasks
   */
  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { status, layer_num, limit = '50', offset = '0' } = req.query;

      // 验证项目存在
      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 构建查询条件
      const where: any = { project_id: projectId };
      if (status) where.status = status;
      if (layer_num) where.layer_num = parseInt(layer_num as string);

      const tasks = await TaskExecution.findAll({
        where,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [
          ['layer_num', 'ASC'],
          ['created_at', 'ASC'],
        ],
      });

      const total = await TaskExecution.count({ where });

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
          },
        },
      });
    } catch (error) {
      logger.error('Error listing tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list tasks',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取任务详情
   * GET /api/projects/:projectId/tasks/:taskId
   */
  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;

      const task = await TaskExecution.findOne({
        where: {
          project_id: projectId,
          task_id: taskId,
        },
      });

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found',
        });
        return;
      }

      // 获取任务执行日志
      const logs = await ExecutionLog.findAll({
        where: { task_execution_id: task.id },
        order: [['created_at', 'ASC']],
        limit: 100,
      });

      res.json({
        success: true,
        data: {
          task,
          logs,
        },
      });
    } catch (error) {
      logger.error('Error getting task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get task',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 重试失败的任务
   * POST /api/projects/:projectId/tasks/:taskId/retry
   */
  async retryTask(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;

      const task = await TaskExecution.findOne({
        where: {
          project_id: projectId,
          task_id: taskId,
        },
      });

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found',
        });
        return;
      }

      // 验证任务状态
      if (task.status !== 'failed') {
        res.status(400).json({
          success: false,
          error: 'Only failed tasks can be retried',
          currentStatus: task.status,
        });
        return;
      }

      // 重置任务状态
      await task.update({
        status: 'pending',
        retry_count: (task.retry_count || 0) + 1,
        started_at: null,
        completed_at: null,
        error_message: null,
      });

      logger.info(`Task retry initiated: ${taskId} in project ${projectId}`);

      res.json({
        success: true,
        message: 'Task retry initiated',
        data: task,
      });

      // TODO: 触发任务重新执行（集成 DAG 引擎）
    } catch (error) {
      logger.error('Error retrying task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retry task',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取任务执行日志
   * GET /api/projects/:projectId/tasks/:taskId/logs
   */
  async getTaskLogs(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;
      const { limit = '100', offset = '0' } = req.query;

      const task = await TaskExecution.findOne({
        where: {
          project_id: projectId,
          task_id: taskId,
        },
      });

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found',
        });
        return;
      }

      const logs = await ExecutionLog.findAll({
        where: { task_execution_id: task.id },
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['created_at', 'ASC']],
      });

      const total = await ExecutionLog.count({
        where: { task_execution_id: task.id },
      });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting task logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get task logs',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 取消正在执行的任务
   * POST /api/projects/:projectId/tasks/:taskId/cancel
   */
  async cancelTask(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;

      const task = await TaskExecution.findOne({
        where: {
          project_id: projectId,
          task_id: taskId,
        },
      });

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found',
        });
        return;
      }

      // 验证任务状态
      if (task.status !== 'running') {
        res.status(400).json({
          success: false,
          error: 'Only running tasks can be cancelled',
          currentStatus: task.status,
        });
        return;
      }

      // 更新任务状态为已取消
      await task.update({
        status: 'cancelled',
        completed_at: new Date(),
        error_message: 'Task cancelled by user',
      });

      logger.info(`Task cancelled: ${taskId} in project ${projectId}`);

      res.json({
        success: true,
        message: 'Task cancelled successfully',
        data: task,
      });

      // TODO: 向执行器发送取消信号
    } catch (error) {
      logger.error('Error cancelling task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel task',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// 导出单例实例
export const taskController = new TaskController();
