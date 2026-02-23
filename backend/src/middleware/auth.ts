import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import logger from '@/utils/logger';

/**
 * 扩展 Request 接口，添加 user 属性
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
}

/**
 * JWT 认证中间件
 * 验证 Authorization header 中的 JWT token
 * 如果 token 无效或缺失，返回 401 错误
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // 从 Authorization header 中提取 token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Auth middleware: No authorization header provided', {
        path: req.path,
        method: req.method,
      });

      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        message: 'Authentication required',
      });
      return;
    }

    // 验证 header 格式：Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Auth middleware: Invalid authorization header format', {
        path: req.path,
        method: req.method,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
        message: 'Expected format: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    // 验证 token
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // 将用户信息附加到 request 对象
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        ...decoded,
      };

      logger.debug('Auth middleware: Token verified successfully', {
        userId: req.user?.id,
        path: req.path,
      });

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Auth middleware: Token expired', {
          path: req.path,
          method: req.method,
        });

        res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired. Please login again.',
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Auth middleware: Invalid token', {
          path: req.path,
          method: req.method,
          error: error.message,
        });

        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Authentication failed',
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    logger.error('Auth middleware: Unexpected error', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during authentication',
    });
  }
}

/**
 * 可选认证中间件
 * 如果提供了 token，验证并附加用户信息
 * 如果没有提供 token，继续处理但不附加用户信息
 * 用于可以在登录和未登录状态下访问的路由
 */
export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    // 如果没有 authorization header，直接继续
    if (!authHeader) {
      logger.debug('Optional auth middleware: No token provided, continuing', {
        path: req.path,
      });
      next();
      return;
    }

    // 验证 header 格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.debug('Optional auth middleware: Invalid format, continuing without auth', {
        path: req.path,
      });
      next();
      return;
    }

    const token = parts[1];

    try {
      // 尝试验证 token
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        ...decoded,
      };

      logger.debug('Optional auth middleware: Token verified', {
        userId: req.user?.id,
        path: req.path,
      });
    } catch (error) {
      // Token 无效，但这是可选的，所以继续处理
      logger.debug('Optional auth middleware: Invalid token, continuing without auth', {
        path: req.path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware: Unexpected error', error);
    // 即使出错，也继续处理（因为认证是可选的）
    next();
  }
}

/**
 * 角色验证中间件工厂函数
 * 创建一个验证用户角色的中间件
 * @param allowedRoles 允许访问的角色列表
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Role middleware: No user found in request', {
        path: req.path,
      });

      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
      return;
    }

    const userRole = req.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      logger.warn('Role middleware: Insufficient permissions', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
      });
      return;
    }

    logger.debug('Role middleware: Access granted', {
      userId: req.user.id,
      userRole,
      path: req.path,
    });

    next();
  };
}
