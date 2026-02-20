# Task: 实现错误处理中间件

## 元数据
- **Task ID**: backend-5.4
- **Layer**: 5
- **Dependencies**: [2.4]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4]
- **Estimated Complexity**: Low

## 目标
实现统一的错误处理中间件，格式化错误响应，记录错误日志。

## 实现步骤

### 1. 创建错误处理中间件
创建 `src/middleware/errorHandler.ts`：
```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';
import { config } from '@/config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // 未知错误
  res.status(500).json({
    success: false,
    error: config.env === 'production' ? 'Internal Server Error' : err.message,
    ...(config.env !== 'production' && { stack: err.stack }),
  });
}
```

## Claude 执行 Prompt

请实现错误处理中间件：定义AppError类，格式化错误响应，记录日志。
