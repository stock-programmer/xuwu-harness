import { Router } from 'express';
import {
  projectController,
  taskController,
  fileController,
  workflowController,
} from '../controllers';

/**
 * 创建 API 路由
 */
export function createApiRoutes(): Router {
  const router = Router();

  // ==================== Project Routes ====================
  // 创建项目
  router.post('/projects', (req, res) =>
    projectController.createProject(req, res)
  );

  // 列出所有项目
  router.get('/projects', (req, res) => projectController.listProjects(req, res));

  // 获取项目统计数据（必须在 /projects/:id 之前，否则 'stats' 会被当作 id）
  router.get('/projects/stats', (req, res) =>
    projectController.getProjectStats(req, res)
  );

  // 获取项目详情
  router.get('/projects/:id', (req, res) =>
    projectController.getProject(req, res)
  );

  // 获取项目状态
  router.get('/projects/:id/status', (req, res) =>
    projectController.getProjectStatus(req, res)
  );

  // 更新项目
  router.put('/projects/:id', (req, res) =>
    projectController.updateProject(req, res)
  );

  // 删除项目
  router.delete('/projects/:id', (req, res) =>
    projectController.deleteProject(req, res)
  );

  // 启动项目
  router.post('/projects/:id/start', (req, res) =>
    projectController.startProject(req, res)
  );

  // 暂停项目
  router.post('/projects/:id/pause', (req, res) =>
    projectController.pauseProject(req, res)
  );

  // 恢复项目
  router.post('/projects/:id/resume', (req, res) =>
    projectController.resumeProject(req, res)
  );

  // 重置项目
  router.post('/projects/:id/reset', (req, res) =>
    projectController.resetProject(req, res)
  );

  // ==================== Task Routes ====================
  // 列出项目的所有任务
  router.get('/projects/:projectId/tasks', (req, res) =>
    taskController.listTasks(req, res)
  );

  // 获取任务详情
  router.get('/projects/:projectId/tasks/:taskId', (req, res) =>
    taskController.getTask(req, res)
  );

  // 获取任务日志
  router.get('/projects/:projectId/tasks/:taskId/logs', (req, res) =>
    taskController.getTaskLogs(req, res)
  );

  // 重试失败的任务
  router.post('/projects/:projectId/tasks/:taskId/retry', (req, res) =>
    taskController.retryTask(req, res)
  );

  // 取消正在执行的任务
  router.post('/projects/:projectId/tasks/:taskId/cancel', (req, res) =>
    taskController.cancelTask(req, res)
  );

  // ==================== File Routes ====================
  // 获取文件树
  router.get('/projects/:projectId/files/tree', (req, res) =>
    fileController.getFileTree(req, res)
  );

  // 获取文件树（向后兼容）
  router.get('/projects/:projectId/files', (req, res) =>
    fileController.getFileTree(req, res)
  );

  // 读取文件内容
  router.get('/projects/:projectId/files/content', (req, res) =>
    fileController.readFile(req, res)
  );

  // 写入文件内容
  router.post('/projects/:projectId/files/content', (req, res) =>
    fileController.writeFile(req, res)
  );

  // 删除文件
  router.delete('/projects/:projectId/files', (req, res) =>
    fileController.deleteFile(req, res)
  );

  // ==================== Workflow Routes ====================
  // 执行工作模式
  router.post('/projects/:projectId/modes/:mode/execute', (req, res) =>
    workflowController.executeMode(req, res)
  );

  // 获取项目进度
  router.get('/projects/:projectId/progress', (req, res) =>
    workflowController.getProgress(req, res)
  );

  // 切换工作模式
  router.post('/projects/:projectId/modes/switch', (req, res) =>
    workflowController.switchMode(req, res)
  );

  // 取消当前执行
  router.post('/projects/:projectId/cancel', (req, res) =>
    workflowController.cancelExecution(req, res)
  );

  // ==================== Health Check ====================
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
