import { Request, Response } from 'express';
import { Project, TaskExecution, LayerExecution } from '../models';
import { WorkflowOrchestrator } from '../services/workflow/WorkflowOrchestrator';
import { WorkMode } from '../types/workflow.types';
import logger from '../utils/logger';
import path from 'path';

/**
 * WorkflowController
 * 处理工作流执行相关的 API 请求
 */
export class WorkflowController {
  // 移除全局 orchestrator，改为为每个项目创建独立实例
  // private orchestrator: WorkflowOrchestrator;

  constructor() {
    // 不再需要注入 orchestrator
  }

  /**
   * 执行工作模式
   * POST /api/projects/:projectId/modes/:mode/execute
   */
  async executeMode(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const mode = req.params.mode as string;
      const { input } = req.body;

      // 验证项目存在
      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 验证模式
      const validModes = [
        'prd',
        'architecture',
        'dev_plan',
        'task_gen',
        'task_exec',
        'loop_test',
        'deploy',
      ];

      if (!validModes.includes(mode)) {
        res.status(400).json({
          success: false,
          error: `Invalid mode. Must be one of: ${validModes.join(', ')}`,
        });
        return;
      }

      // 验证输入
      if (!input) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: input',
        });
        return;
      }

      // 获取项目的工作目录
      const projectRootPath = project.root_path;
      const absoluteProjectPath = path.isAbsolute(projectRootPath)
        ? projectRootPath
        : path.join(process.cwd(), projectRootPath);

      logger.info(`Executing mode ${mode} for project ${projectId}`, {
        input,
        projectPath: absoluteProjectPath,
      });

      // 为这个项目创建独立的 orchestrator 实例
      const projectOrchestrator = new WorkflowOrchestrator(absoluteProjectPath);

      // 更新项目当前模式
      await project.update({ current_mode: mode });

      // 执行工作流（异步）
      projectOrchestrator
        .executeMode(mode as WorkMode, input)
        .then(() => {
          logger.info(`Mode ${mode} completed for project ${projectId}`);
        })
        .catch((error) => {
          logger.error(`Mode ${mode} failed for project ${projectId}:`, error);
        });

      // 立即返回响应
      res.json({
        success: true,
        message: `Workflow execution started for mode: ${mode}`,
        data: {
          projectId,
          mode,
          input,
          projectPath: absoluteProjectPath,
        },
      });
    } catch (error) {
      logger.error('Error executing mode:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute mode',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取项目进度
   * GET /api/projects/:projectId/progress
   */
  async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;

      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 获取所有层级
      const layers = await LayerExecution.findAll({
        where: { project_id: projectId },
        order: [['layer_num', 'ASC']],
      });

      // 获取所有任务
      const tasks = await TaskExecution.findAll({
        where: { project_id: projectId },
        order: [
          ['layer_num', 'ASC'],
          ['created_at', 'ASC'],
        ],
      });

      // 计算统计信息
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const failedTasks = tasks.filter((t) => t.status === 'failed').length;
      const runningTasks = tasks.filter((t) => t.status === 'running').length;
      const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

      // 查找当前层级
      const currentLayer = layers.find((l) => l.status === 'running');
      const currentTask = tasks.find((t) => t.status === 'running');

      res.json({
        success: true,
        data: {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            current_mode: project.current_mode,
          },
          progress: {
            totalLayers: layers.length,
            currentLayer: currentLayer?.layer_num ?? null,
            totalTasks,
            completedTasks,
            failedTasks,
            runningTasks,
            pendingTasks,
            percentage:
              totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : '0',
          },
          currentTask: currentTask
            ? {
                id: currentTask.task_id,
                name: currentTask.task_name,
                status: currentTask.status,
                layer: currentTask.layer_num,
              }
            : null,
          layers: layers.map((layer) => ({
            layer_num: layer.layer_num,
            status: layer.status,
            completed_tasks: layer.completed_tasks,
            failed_tasks: layer.failed_tasks,
            total_tasks: layer.total_tasks,
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progress',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 切换工作模式
   * POST /api/projects/:projectId/modes/switch
   */
  async switchMode(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { mode } = req.body;

      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 验证模式
      const validModes = [
        'dev-layer-by-layer',
        'dev-task-by-task',
        'dev-full-auto',
        'dev-interactive',
        'review',
        'fix',
        'test',
      ];

      if (!validModes.includes(mode)) {
        res.status(400).json({
          success: false,
          error: `Invalid mode. Must be one of: ${validModes.join(', ')}`,
        });
        return;
      }

      // 更新项目模式
      await project.update({ current_mode: mode });

      logger.info(`Mode switched to ${mode} for project ${projectId}`);

      res.json({
        success: true,
        message: `Mode switched to: ${mode}`,
        data: {
          projectId,
          mode,
        },
      });
    } catch (error) {
      logger.error('Error switching mode:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to switch mode',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 取消当前执行
   * POST /api/projects/:projectId/cancel
   */
  async cancelExecution(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;

      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 取消所有正在运行的任务
      const runningTasks = await TaskExecution.findAll({
        where: {
          project_id: projectId,
          status: 'running',
        },
      });

      for (const task of runningTasks) {
        await task.update({
          status: 'cancelled',
          completed_at: new Date(),
          error_message: 'Execution cancelled by user',
        });
      }

      logger.info(`Execution cancelled for project ${projectId}`);

      res.json({
        success: true,
        message: 'Execution cancelled',
        data: {
          cancelledTasks: runningTasks.length,
        },
      });

      // TODO: 向执行器发送取消信号
    } catch (error) {
      logger.error('Error cancelling execution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel execution',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// 导出单例实例（不再需要 orchestrator）
export const workflowController = new WorkflowController();
