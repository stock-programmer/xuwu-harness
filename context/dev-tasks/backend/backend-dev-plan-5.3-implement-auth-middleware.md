# Task: 实现认证中间件

## 元数据
- **Task ID**: backend-5.3
- **Layer**: 5
- **Dependencies**: [2.4]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4]
- **Estimated Complexity**: Medium

## 目标
实现 JWT 认证中间件，保护 API 路由和 WebSocket 连接。

## 实现步骤

### 1. 创建认证中间件
创建 `src/middleware/auth.ts`：
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import logger from '@/utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
}
```

## Claude 执行 Prompt

请实现 JWT 认证中间件：验证token，注入user信息，处理错误。
