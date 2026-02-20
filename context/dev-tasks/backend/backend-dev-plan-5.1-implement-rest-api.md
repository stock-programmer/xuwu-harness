# Task: 实现 REST API 路由

## 元数据
- **Task ID**: backend-5.1
- **Layer**: 5
- **Dependencies**: [2.4, 4.1]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4]
- **Estimated Complexity**: Medium

## 目标
实现完整的 REST API 接口，包括项目管理、任务管理、文件操作、工作流控制等API。

## 前置条件
- Express 服务器已创建（Task 2.4）
- Workflow Orchestrator 已实现（Task 4.1）
- 数据模型已定义

## 实现步骤

### 1. 创建 ProjectController
创建 `src/controllers/ProjectController.ts`：
```typescript
export class ProjectController {
  async createProject(req: Request, res: Response) {
    // 创建项目
  }

  async listProjects(req: Request, res: Response) {
    // 列出项目
  }

  async getProject(req: Request, res: Response) {
    // 获取项目详情
  }

  async updateProject(req: Request, res: Response) {
    // 更新项目
  }

  async deleteProject(req: Request, res: Response) {
    // 删除项目
  }
}
```

### 2. 创建其他控制器
- TaskController
- FileController
- WorkflowController

### 3. 创建路由文件
创建 `src/routes/api.ts`：
```typescript
import { Router } from 'express';

const router = Router();

// Project routes
router.post('/projects', projectController.createProject);
router.get('/projects', projectController.listProjects);
router.get('/projects/:id', projectController.getProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Task routes
router.get('/projects/:id/tasks', taskController.listTasks);
router.get('/projects/:id/tasks/:taskId', taskController.getTask);
router.post('/projects/:id/tasks/:taskId/retry', taskController.retryTask);

// Workflow routes
router.post('/projects/:id/modes/:mode/execute', workflowController.executeMode);
router.get('/projects/:id/progress', workflowController.getProgress);

export default router;
```

### 4. 集成到 Express App
在 `src/app.ts` 中：
```typescript
import apiRoutes from './routes/api';
app.use('/api', apiRoutes);
```

## 期望输出
- 控制器文件（ProjectController, TaskController等）
- 路由文件（src/routes/api.ts）
- 完整的REST API接口

## 验证标准

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"fullstack","root_path":"/path"}'
```

## Claude 执行 Prompt

请实现 REST API 路由：

1. 创建控制器：
   - src/controllers/ProjectController.ts
   - src/controllers/TaskController.ts
   - src/controllers/FileController.ts
   - src/controllers/WorkflowController.ts

2. ProjectController 实现 CRUD 方法：
   - createProject, listProjects, getProject, updateProject, deleteProject

3. 创建 src/routes/api.ts，配置所有路由：
   - POST /api/projects
   - GET /api/projects
   - GET /api/projects/:id
   - PUT /api/projects/:id
   - DELETE /api/projects/:id
   - GET /api/projects/:id/tasks
   - POST /api/projects/:id/modes/:mode/execute
   - 等等

4. 在 src/app.ts 中集成路由

5. 测试API端点可访问

参考 backend-architecture.md 第 6.1 节。
