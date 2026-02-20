# Task: 实现 Express 服务器基础架构

## 元数据
- **Task ID**: backend-2.4
- **Layer**: 2
- **Dependencies**: [1.1, 1.2]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: Medium

## 目标
创建 Express 应用，配置中间件（CORS、body-parser、日志等），创建基础路由结构，实现错误处理。

## 前置条件
- Express 已安装（Task 1.1）
- 环境变量已配置（Task 1.2）

## 实现步骤

### 1. 创建 Express 应用
创建 `src/app.ts`：
```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import logger from '@/utils/logger';
import { config } from '@/config/env';

export function createApp(): Express {
  const app = express();

  // CORS 配置
  app.use(
    cors({
      origin: config.env === 'production' ? ['https://yourdomain.com'] : '*',
      credentials: true,
    })
  );

  // Body Parser 中间件
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  // 请求日志中间件
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      ip: req.ip,
    });
    next();
  });

  // 健康检查端点
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 根路由
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Claude Code Harness Backend',
      version: '1.0.0',
      environment: config.env,
    });
  });

  // API 路由（稍后添加）
  // app.use('/api', apiRoutes);

  // 404 处理
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      path: req.path,
    });
  });

  // 错误处理中间件
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Express error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      error: config.env === 'production' ? 'Internal Server Error' : err.message,
      ...(config.env !== 'production' && { stack: err.stack }),
    });
  });

  return app;
}
```

### 2. 创建 HTTP 服务器启动文件
更新 `src/index.ts`：
```typescript
import http from 'http';
import { createApp } from './app';
import { config, validateConfig } from './config/env';
import logger from './utils/logger';

async function bootstrap() {
  try {
    // 验证配置
    validateConfig();

    logger.info('Starting Claude Code Harness Backend...');
    logger.info(`Environment: ${config.env}`);

    // 创建 Express app
    const app = createApp();

    // 创建 HTTP server
    const server = http.createServer(app);

    // 启动服务器
    server.listen(config.port, config.host, () => {
      logger.info(`HTTP server running on http://${config.host}:${config.port}`);
      logger.info(`Health check: http://${config.host}:${config.port}/health`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
```

### 3. 创建路由目录结构
```bash
mkdir -p src/routes
mkdir -p src/controllers
mkdir -p src/middleware
```

## 期望输出

### 文件结构
```
src/
├── app.ts
├── index.ts
├── routes/
├── controllers/
└── middleware/
```

### Express 应用
- CORS 配置
- Body Parser 中间件
- 请求日志中间件
- 健康检查端点
- 404 处理
- 错误处理中间件

## 验证标准

### 1. 服务器启动验证
```bash
npm run dev
```
预期：服务器成功启动，日志显示运行地址

### 2. 健康检查验证
```bash
curl http://localhost:3000/health
```
预期：返回 JSON，包含 status: "ok"

### 3. 根路由验证
```bash
curl http://localhost:3000/
```
预期：返回项目信息 JSON

### 4. 404 处理验证
```bash
curl http://localhost:3000/nonexistent
```
预期：返回 404 状态码和错误 JSON

### 5. CORS 验证
```bash
curl -H "Origin: http://example.com" http://localhost:3000/health -I
```
预期：响应头包含 Access-Control-Allow-Origin

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/app.ts，实现 createApp() 函数：
   - 配置 CORS 中间件（开发环境允许所有来源）
   - 配置 body-parser（json 和 urlencoded，限制 10mb）
   - 添加请求日志中间件
   - 创建 /health 健康检查端点
   - 创建 / 根路由
   - 添加 404 处理
   - 添加全局错误处理中间件

2. 更新 src/index.ts，实现 bootstrap() 函数：
   - 验证配置
   - 创建 Express app
   - 创建 HTTP server
   - 启动服务器监听
   - 配置 SIGTERM 和 SIGINT 优雅关闭

3. 创建目录：
   - src/routes/
   - src/controllers/
   - src/middleware/

4. 验证 Express 服务器：
   - 运行 `npm run dev`
   - 测试 /health 端点
   - 测试 / 根路由
   - 测试 404 处理
   - 验证日志输出

确保 Express 服务器基础架构完整、中间件配置正确。
