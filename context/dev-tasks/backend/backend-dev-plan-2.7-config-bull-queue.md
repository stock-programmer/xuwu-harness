# Task: 配置 Bull 任务队列

## 元数据
- **Task ID**: backend-2.7
- **Layer**: 2
- **Dependencies**: [1.1, 1.5]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: Medium

## 目标
配置基于 Redis 的 Bull 任务队列，实现异步任务处理、并发控制、重试机制和任务优先级。

## 前置条件
- Bull 已安装（Task 1.1）
- Redis 已配置（Task 1.5）

## 实现步骤

### 1. 创建任务队列配置
创建 `src/config/queue.ts`：
```typescript
import Bull, { Queue, QueueOptions } from 'bull';
import { config } from './env';
import logger from '@/utils/logger';

// Bull 队列配置选项
const queueOptions: QueueOptions = {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
  defaultJobOptions: {
    attempts: 3,           // 最多重试 3 次
    backoff: {
      type: 'exponential', // 指数退避
      delay: 2000,         // 初始延迟 2 秒
    },
    removeOnComplete: 100, // 保留最近 100 个已完成任务
    removeOnFail: 200,     // 保留最近 200 个失败任务
  },
};

// 创建 Claude 任务队列
export const claudeTaskQueue: Queue = new Bull('claude-tasks', queueOptions);

// 队列事件监听
claudeTaskQueue.on('error', (error) => {
  logger.error('Claude task queue error:', error);
});

claudeTaskQueue.on('waiting', (jobId) => {
  logger.debug(`Job ${jobId} is waiting`);
});

claudeTaskQueue.on('active', (job) => {
  logger.info(`Job ${job.id} started`, {
    taskId: job.data.taskId,
  });
});

claudeTaskQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, {
    taskId: job.data.taskId,
    duration: Date.now() - job.timestamp,
  });
});

claudeTaskQueue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed`, {
    taskId: job.data.taskId,
    error: error.message,
    attempts: job.attemptsMade,
  });
});

claudeTaskQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`, {
    taskId: job.data.taskId,
  });
});

// 导出队列
export { claudeTaskQueue };
```

### 2. 创建任务队列服务
创建 `src/services/queue.service.ts`：
```typescript
import { Job, JobOptions } from 'bull';
import { claudeTaskQueue } from '@/config/queue';
import logger from '@/utils/logger';

export interface ClaudeTaskData {
  taskId: string;
  prompt: string;
  projectId?: string;
  options?: any;
}

export class QueueService {
  /**
   * 添加 Claude 任务到队列
   */
  async addClaudeTask(
    data: ClaudeTaskData,
    options?: JobOptions
  ): Promise<Job<ClaudeTaskData>> {
    try {
      const job = await claudeTaskQueue.add(data, {
        priority: options?.priority || 1,
        delay: options?.delay,
        jobId: data.taskId, // 使用 taskId 作为唯一 job ID
        ...options,
      });

      logger.info(`Added Claude task to queue: ${data.taskId}`, {
        jobId: job.id,
        priority: job.opts.priority,
      });

      return job;
    } catch (error) {
      logger.error('Failed to add Claude task to queue:', error);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const job = await claudeTaskQueue.getJob(taskId);

      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        status: state,
        progress,
        data: job.data,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
      };
    } catch (error) {
      logger.error(`Failed to get task status for ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const job = await claudeTaskQueue.getJob(taskId);

      if (!job) {
        logger.warn(`Cannot cancel task ${taskId}: job not found`);
        return false;
      }

      await job.remove();

      logger.info(`Task ${taskId} cancelled`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 重试失败任务
   */
  async retryTask(taskId: string): Promise<boolean> {
    try {
      const job = await claudeTaskQueue.getJob(taskId);

      if (!job) {
        logger.warn(`Cannot retry task ${taskId}: job not found`);
        return false;
      }

      await job.retry();

      logger.info(`Task ${taskId} retried`);
      return true;
    } catch (error) {
      logger.error(`Failed to retry task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        claudeTaskQueue.getWaitingCount(),
        claudeTaskQueue.getActiveCount(),
        claudeTaskQueue.getCompletedCount(),
        claudeTaskQueue.getFailedCount(),
        claudeTaskQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * 清空队列（仅开发环境）
   */
  async clearQueue(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear queue in production');
    }

    try {
      await claudeTaskQueue.empty();
      logger.warn('Queue cleared');
    } catch (error) {
      logger.error('Failed to clear queue:', error);
      throw error;
    }
  }

  /**
   * 优雅关闭队列
   */
  async close(): Promise<void> {
    try {
      await claudeTaskQueue.close();
      logger.info('Queue closed');
    } catch (error) {
      logger.error('Failed to close queue:', error);
      throw error;
    }
  }
}

export const queueService = new QueueService();
```

## 期望输出

### 新增文件
- `src/config/queue.ts`
- `src/services/queue.service.ts`

### 队列功能
- 任务添加（支持优先级、延迟）
- 任务状态查询
- 任务取消
- 任务重试
- 队列统计
- 事件监听

## 验证标准

### 1. 队列初始化验证
```typescript
import { claudeTaskQueue } from '@/config/queue';

console.log('Queue name:', claudeTaskQueue.name);
// 应该输出: claude-tasks
```

### 2. 添加任务验证
```typescript
import { queueService } from '@/services/queue.service';

const job = await queueService.addClaudeTask({
  taskId: 'test-1',
  prompt: 'Test prompt',
});

console.log('Job ID:', job.id);
```

### 3. 任务状态验证
```typescript
const status = await queueService.getTaskStatus('test-1');
console.log('Task status:', status);
```

### 4. 队列统计验证
```typescript
const stats = await queueService.getQueueStats();
console.log('Queue stats:', stats);
```

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/config/queue.ts：
   - 配置 Bull 队列选项（Redis 连接、重试策略）
   - 创建 claudeTaskQueue 队列
   - 添加队列事件监听：error, waiting, active, completed, failed, stalled

2. 创建 src/services/queue.service.ts：
   - 定义 ClaudeTaskData 接口
   - 实现 QueueService 类：
     * addClaudeTask()：添加任务，支持优先级和延迟
     * getTaskStatus()：查询任务状态
     * cancelTask()：取消任务
     * retryTask()：重试失败任务
     * getQueueStats()：获取队列统计
     * clearQueue()：清空队列（仅开发环境）
     * close()：优雅关闭

3. 导出单例 queueService

4. 验证任务队列：
   - 添加测试任务
   - 查询任务状态
   - 获取队列统计
   - 验证事件日志

确保任务队列配置完整、重试机制正常、事件监听工作。
