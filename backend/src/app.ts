import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import logger from './utils/logger';
import { config } from './config/env';
import { createApiRoutes } from './routes/api';
import { sequelize } from './config/database';
import { fileSystemMonitor } from './services/FileSystemMonitor';

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

  // 健康检查端点（增强版）
  app.get('/health', async (req: Request, res: Response) => {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: '1.0.0',
      services: {
        database: 'unknown',
        fileMonitor: 'unknown',
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB',
      },
    };

    // Check database connection
    try {
      await sequelize.authenticate();
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Check file system monitor
    health.services.fileMonitor = fileSystemMonitor.isWatching() ? 'active' : 'inactive';

    res.status(health.status === 'ok' ? 200 : 503).json(health);
  });

  // 根路由
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Claude Code Harness Backend',
      version: '1.0.0',
      environment: config.env,
      documentation: '/api',
      health: '/health',
    });
  });

  // API 路由
  const apiRoutes = createApiRoutes();
  app.use('/api', apiRoutes);
  logger.info('API routes initialized');

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
