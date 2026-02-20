# Task: 实现 Progress Tracker（进度追踪器）

## 元数据
- **Task ID**: backend-4.4
- **Layer**: 4
- **Dependencies**: [2.1, 4.2]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4, 4.5]
- **Estimated Complexity**: Medium

## 目标
实现任务进度追踪器，实时跟踪 DAG 执行进度，通过 WebSocket 推送进度更新。

## 前置条件
- 数据模型已定义（Task 2.1）
- WebSocket Manager 已实现（Task 4.2）

## 实现步骤

### 1. 创建 Progress Tracker
创建 `src/services/ProgressTracker.ts`：
```typescript
import { TaskExecution, LayerExecution, Project } from '@/models';
import { WebSocketManager } from './websocket/WebSocketManager';
import { TaskProgressMessage } from '@/types/websocket.types';
import logger from '@/utils/logger';

export class ProgressTracker {
  constructor(private wsManager: WebSocketManager) {}

  /**
   * 更新任务进度
   */
  async updateTaskProgress(projectId: string, taskId: string, status: string): Promise<void> {
    // 更新数据库
    await TaskExecution.update(
      { status },
      { where: { project_id: projectId, task_id: taskId } }
    );

    // 获取进度
    const progress = await this.calculateProgress(projectId);

    // 推送 WebSocket 消息
    const message: TaskProgressMessage = {
      type: 'task_progress',
      payload: progress,
      timestamp: Date.now(),
    };

    this.wsManager.broadcastToRoom(`project:${projectId}`, message);
  }

  /**
   * 计算项目进度
   */
  private async calculateProgress(projectId: string) {
    const total = await TaskExecution.count({ where: { project_id: projectId } });
    const completed = await TaskExecution.count({
      where: { project_id: projectId, status: 'completed' },
    });

    return {
      projectId,
      totalTasks: total,
      completedTasks: completed,
      percentage: Math.round((completed / total) * 100),
      // ...更多字段
    };
  }
}
```

## 验证标准

测试进度计算、数据库更新、WebSocket 推送。

## Claude 执行 Prompt

请实现 ProgressTracker：跟踪任务进度，计算百分比，通过WebSocket推送更新。
