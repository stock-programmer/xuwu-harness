import { Request, Response } from 'express';
import { Project, TaskExecution, LayerExecution } from '../models';
import logger from '../utils/logger';
import { Op } from 'sequelize';

/**
 * ProjectController
 * 处理项目相关的 API 请求
 */
export class ProjectController {
  /**
   * 创建新项目
   * POST /api/projects
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, root_path, status = 'active' } = req.body;

      // 验证必填字段
      if (!name || !type || !root_path) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, type, root_path',
        });
        return;
      }

      // 验证类型
      if (!['fullstack', 'frontend', 'backend'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project type. Must be: fullstack, frontend, or backend',
        });
        return;
      }

      // 检查项目名是否已存在
      const existingProject = await Project.findOne({
        where: { name },
      });

      if (existingProject) {
        res.status(409).json({
          success: false,
          error: `项目名称 "${name}" 已存在，请使用其他名称`,
        });
        return;
      }

      // 创建项目
      const project = await Project.create({
        name,
        type,
        root_path,
        status,
      });

      logger.info(`Project created: ${project.id}`, { name, type });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 列出所有项目
   * GET /api/projects
   * Query params:
   *  - status: filter by status
   *  - type: filter by type
   *  - limit: pagination limit
   *  - offset: pagination offset
   */
  async listProjects(req: Request, res: Response): Promise<void> {
    try {
      const { status, type, limit = '10', offset = '0' } = req.query;

      // 构建查询条件
      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const projects = await Project.findAll({
        where,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['created_at', 'DESC']],
      });

      const total = await Project.count({ where });

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
          },
        },
      });
    } catch (error) {
      logger.error('Error listing projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list projects',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取项目详情
   * GET /api/projects/:id
   */
  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 获取项目统计信息
      const totalTasks = await TaskExecution.count({
        where: { project_id: id },
      });

      const completedTasks = await TaskExecution.count({
        where: { project_id: id, status: 'completed' },
      });

      const failedTasks = await TaskExecution.count({
        where: { project_id: id, status: 'failed' },
      });

      const totalLayers = await LayerExecution.count({
        where: { project_id: id },
      });

      res.json({
        success: true,
        data: {
          project,
          stats: {
            totalTasks,
            completedTasks,
            failedTasks,
            totalLayers,
            completionRate:
              totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : '0',
          },
        },
      });
    } catch (error) {
      logger.error('Error getting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 更新项目
   * PUT /api/projects/:id
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, type, status, current_mode, root_path } = req.body;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 验证类型（如果提供）
      if (type && !['fullstack', 'frontend', 'backend'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project type. Must be: fullstack, frontend, or backend',
        });
        return;
      }

      // 更新项目
      await project.update({
        ...(name && { name }),
        ...(type && { type }),
        ...(status && { status }),
        ...(current_mode !== undefined && { current_mode }),
        ...(root_path && { root_path }),
      });

      logger.info(`Project updated: ${id}`);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 删除项目
   * DELETE /api/projects/:id
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 删除项目（级联删除相关记录）
      await project.destroy();

      logger.info(`Project deleted: ${id}`);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取项目统计数据
   * GET /api/projects/stats
   */
  async getProjectStats(req: Request, res: Response): Promise<void> {
    try {
      const totalProjects = await Project.count();

      const runningProjects = await Project.count({
        where: { status: 'running' },
      });

      const completedProjects = await Project.count({
        where: { status: 'completed' },
      });

      const failedProjects = await Project.count({
        where: { status: 'failed' },
      });

      const pausedProjects = await Project.count({
        where: { status: 'paused' },
      });

      res.json({
        success: true,
        data: {
          totalProjects,
          runningProjects,
          completedProjects,
          failedProjects,
          pausedProjects,
        },
      });
    } catch (error) {
      logger.error('Error getting project stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project stats',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 启动项目
   * POST /api/projects/:id/start
   */
  async startProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 更新项目状态为 running
      await project.update({ status: 'running' });

      logger.info(`Project started: ${id}`);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error starting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 暂停项目
   * POST /api/projects/:id/pause
   */
  async pauseProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 更新项目状态为 paused
      await project.update({ status: 'paused' });

      logger.info(`Project paused: ${id}`);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error pausing project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to pause project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 恢复项目
   * POST /api/projects/:id/resume
   */
  async resumeProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 更新项目状态为 running
      await project.update({ status: 'running' });

      logger.info(`Project resumed: ${id}`);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error resuming project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resume project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 重置项目
   * POST /api/projects/:id/reset
   */
  async resetProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 重置项目状态和模式
      await project.update({
        status: 'idle',
        current_mode: null,
      });

      // 删除项目的所有任务执行记录
      await TaskExecution.destroy({
        where: { project_id: id },
      });

      // 删除项目的所有层执行记录
      await LayerExecution.destroy({
        where: { project_id: id },
      });

      logger.info(`Project reset: ${id}`);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error resetting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset project',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取项目状态
   * GET /api/projects/:id/status
   */
  async getProjectStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const project = await Project.findByPk(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 获取当前层信息
      const currentLayerExecution = await LayerExecution.findOne({
        where: { project_id: id, status: 'running' },
        order: [['created_at', 'DESC']],
      });

      // 获取任务统计
      const totalTasks = await TaskExecution.count({
        where: { project_id: id },
      });

      const completedTasks = await TaskExecution.count({
        where: { project_id: id, status: 'completed' },
      });

      res.json({
        success: true,
        data: {
          status: project.status,
          currentLayer: currentLayerExecution?.layer_num || 0,
          completedTasks,
          totalTasks,
        },
      });
    } catch (error) {
      logger.error('Error getting project status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// 导出单例实例
export const projectController = new ProjectController();
