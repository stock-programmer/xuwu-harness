import { Request, Response } from 'express';
import { Project } from '../models';
import logger from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * FileController
 * 处理文件操作相关的 API 请求
 */
export class FileController {
  /**
   * 获取项目文件树
   * GET /api/projects/:projectId/files
   */
  async getFileTree(req: Request, res: Response): Promise<void> {
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

      // 获取文件树
      const fileTree = await this.buildFileTree(project.root_path, project.root_path);

      res.json({
        success: true,
        data: {
          root: project.root_path,
          tree: fileTree,
        },
      });
    } catch (error) {
      logger.error('Error getting file tree:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get file tree',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 读取文件内容
   * GET /api/projects/:projectId/files/content
   */
  async readFile(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { path: filePath } = req.query;

      logger.info(`[FileController] readFile called: projectId=${projectId}, path=${filePath}`);

      if (!filePath || typeof filePath !== 'string') {
        logger.warn('[FileController] Missing or invalid path parameter');
        res.status(400).json({
          success: false,
          error: 'Missing required query parameter: path',
        });
        return;
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        logger.warn(`[FileController] Project not found: ${projectId}`);
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 安全检查：确保路径在项目根目录下
      const fullPath = path.join(project.root_path, filePath);
      const normalizedPath = path.normalize(fullPath);

      logger.info(`[FileController] Attempting to read file: ${normalizedPath}`);

      if (!normalizedPath.startsWith(project.root_path)) {
        logger.warn(`[FileController] Path outside project root: ${normalizedPath}`);
        res.status(403).json({
          success: false,
          error: 'Access denied: path outside project root',
        });
        return;
      }

      // 读取文件
      const content = await fs.readFile(normalizedPath, 'utf-8');

      logger.info(`[FileController] File read successfully: ${filePath} (${content.length} bytes)`);

      res.json({
        success: true,
        data: {
          path: filePath,
          content,
        },
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        logger.warn(`[FileController] File not found: ${req.query.path}`);
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      logger.error('[FileController] Error reading file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to read file',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 写入文件内容
   * POST /api/projects/:projectId/files/content
   */
  async writeFile(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { path: filePath, content } = req.body;

      logger.info(`[FileController] writeFile called: projectId=${projectId}, path=${filePath}, contentLength=${content?.length || 0}`);

      if (!filePath || content === undefined) {
        logger.warn('[FileController] Missing required fields in writeFile');
        res.status(400).json({
          success: false,
          error: 'Missing required fields: path, content',
        });
        return;
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        logger.warn(`[FileController] Project not found in writeFile: ${projectId}`);
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 安全检查：确保路径在项目根目录下
      const fullPath = path.join(project.root_path, filePath);
      const normalizedPath = path.normalize(fullPath);

      logger.info(`[FileController] Attempting to write file: ${normalizedPath}`);

      if (!normalizedPath.startsWith(project.root_path)) {
        logger.warn(`[FileController] Path outside project root in writeFile: ${normalizedPath}`);
        res.status(403).json({
          success: false,
          error: 'Access denied: path outside project root',
        });
        return;
      }

      // 确保目录存在
      await fs.mkdir(path.dirname(normalizedPath), { recursive: true });

      // 写入文件
      await fs.writeFile(normalizedPath, content, 'utf-8');

      logger.info(`[FileController] File written successfully: ${filePath}`);

      res.json({
        success: true,
        message: 'File written successfully',
        data: {
          path: filePath,
        },
      });
    } catch (error) {
      logger.error('[FileController] Error writing file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to write file',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 删除文件
   * DELETE /api/projects/:projectId/files
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { path: filePath } = req.query;

      if (!filePath || typeof filePath !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Missing required query parameter: path',
        });
        return;
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // 安全检查：确保路径在项目根目录下
      const fullPath = path.join(project.root_path, filePath);
      const normalizedPath = path.normalize(fullPath);

      if (!normalizedPath.startsWith(project.root_path)) {
        res.status(403).json({
          success: false,
          error: 'Access denied: path outside project root',
        });
        return;
      }

      // 删除文件
      await fs.unlink(normalizedPath);

      logger.info(`File deleted: ${filePath} in project ${projectId}`);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      logger.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 构建文件树（辅助方法）
   */
  private async buildFileTree(dirPath: string, rootPath: string): Promise<any> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      const tree = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          // 计算相对于项目根目录的路径
          const relativePath = path.relative(rootPath, fullPath);

          if (entry.isDirectory()) {
            // 跳过常见的忽略目录
            if (
              entry.name === 'node_modules' ||
              entry.name === '.git' ||
              entry.name === 'dist' ||
              entry.name === 'build'
            ) {
              return null;
            }

            return {
              id: relativePath,
              name: entry.name,
              path: relativePath,
              type: 'directory',
              children: await this.buildFileTree(fullPath, rootPath),
            };
          } else {
            // 获取文件大小
            const stats = await fs.stat(fullPath);

            return {
              id: relativePath,
              name: entry.name,
              path: relativePath,
              type: 'file',
              size: stats.size,
            };
          }
        })
      );

      // 过滤掉 null 值（被跳过的目录）
      return tree.filter((item) => item !== null);
    } catch (error) {
      logger.error(`Error building file tree for ${dirPath}:`, error);
      return [];
    }
  }
}

// 导出单例实例
export const fileController = new FileController();
