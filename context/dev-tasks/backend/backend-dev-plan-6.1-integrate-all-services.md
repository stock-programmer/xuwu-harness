# Task: 整合所有服务到主应用

## 元数据
- **Task ID**: backend-6.1
- **Layer**: 6
- **Dependencies**: [5.1, 5.2, 5.3, 5.4]
- **Parallel Group**: [6.1, 6.2]
- **Estimated Complexity**: Medium

## 目标
将所有模块整合到主应用，实现优雅启动和关闭，配置生产环境，实现健康检查。

## 前置条件
- Layer 5 全部完成（API、WebSocket、中间件等）
- 所有核心服务已实现

## 实现步骤

### 1. 更新 src/index.ts
```typescript
import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, sequelize } from './config/database';
import { connectRedis, redisClient } from './config/redis';
import { WebSocketServer } from './services/websocket/WebSocketServer';
import { fileSystemMonitor } from './services/FileSystemMonitor';
import logger from './utils/logger';
import '@/models'; // 导入所有模型

async function bootstrap() {
  try {
    logger.info('Starting Claude Code Harness Backend...');

    // 连接数据库
    await connectDatabase();
    await sequelize.sync({ alter: config.env === 'development' });

    // 连接 Redis
    await connectRedis();

    // 创建 Express app
    const app = createApp();

    // 创建 HTTP server
    const server = http.createServer(app);

    // 初始化 WebSocket
    const wsServer = new WebSocketServer(server);

    // 启动文件监控
    fileSystemMonitor.start(['./context'], (type, path) => {
      logger.debug(`File ${type}: ${path}`);
    });

    // 优雅关闭
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await sequelize.close();
        redisClient.disconnect();
        fileSystemMonitor.stop();
        process.exit(0);
      });
    });

    // 启动服务器
    server.listen(config.port, config.host, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`WebSocket server running on ws://${config.host}:${config.port}/ws`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
```

### 2. 完善 src/app.ts
整合所有路由和中间件

### 3. 配置健康检查
添加 `/health` 端点

## 期望输出
- 完整的应用启动流程
- 优雅关闭机制
- 健康检查端点

## 验证标准

```bash
npm run dev
# 应该成功启动所有服务

curl http://localhost:3000/health
# 应该返回 {"status":"ok"}
```

## Claude 执行 Prompt

请整合所有服务到主应用：

1. 更新 src/index.ts，实现完整的启动流程：
   - 连接数据库
   - 连接 Redis
   - 创建 Express app
   - 创建 HTTP server
   - 初始化 WebSocket
   - 启动文件监控
   - 配置优雅关闭

2. 确保所有服务都在启动时正确初始化

3. 实现 SIGTERM 信号处理

4. 添加启动日志

5. 测试应用可以正常启动

参考 backend-architecture.md 第 6 节。
