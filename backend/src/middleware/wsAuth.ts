import { IncomingMessage } from 'http';
import { URL } from 'url';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/utils/auth';
import logger from '@/utils/logger';

/**
 * WebSocket 认证结果
 */
export interface WSAuthResult {
  authenticated: boolean;
  user?: JWTPayload;
  error?: string;
}

/**
 * 从 WebSocket 请求中认证用户
 * 支持两种方式：
 * 1. 从 URL query 参数中提取 token (?token=xxx)
 * 2. 从 HTTP header 中提取 token (Authorization: Bearer xxx)
 *
 * @param request WebSocket 请求对象
 * @returns 认证结果
 */
export function authenticateWebSocket(request: IncomingMessage): WSAuthResult {
  try {
    let token: string | null = null;

    // 方法 1: 从 URL query 参数中提取 token
    if (request.url) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      token = url.searchParams.get('token');

      if (token) {
        logger.debug('WebSocket auth: Token found in query params');
      }
    }

    // 方法 2: 从 Authorization header 中提取 token
    if (!token) {
      const authHeader = request.headers.authorization;
      token = extractTokenFromHeader(authHeader);

      if (token) {
        logger.debug('WebSocket auth: Token found in Authorization header');
      }
    }

    // 如果没有找到 token
    if (!token) {
      logger.debug('WebSocket auth: No token provided');
      return {
        authenticated: false,
        error: 'No authentication token provided',
      };
    }

    // 验证 token
    const verification = verifyToken(token);

    if (!verification.valid) {
      logger.debug('WebSocket auth: Token verification failed', {
        error: verification.error,
      });
      return {
        authenticated: false,
        error: verification.error || 'Invalid token',
      };
    }

    logger.info('WebSocket auth: Authentication successful', {
      userId: verification.payload?.id,
    });

    return {
      authenticated: true,
      user: verification.payload,
    };
  } catch (error) {
    logger.error('WebSocket auth: Unexpected error during authentication', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * WebSocket 认证中间件
 * 可以在 WebSocket 连接建立时调用以验证用户
 *
 * @param request WebSocket 请求对象
 * @param requireAuth 是否要求认证（true = 必须认证，false = 可选认证）
 * @returns 认证结果，如果 requireAuth=true 且认证失败则返回 null
 */
export function wsAuthMiddleware(
  request: IncomingMessage,
  requireAuth: boolean = true
): WSAuthResult | null {
  const authResult = authenticateWebSocket(request);

  if (requireAuth && !authResult.authenticated) {
    logger.warn('WebSocket auth middleware: Authentication required but failed', {
      error: authResult.error,
      headers: request.headers,
    });
    return null;
  }

  return authResult;
}

/**
 * 为 WebSocket 客户端生成认证 URL
 * @param baseUrl WebSocket 服务器 URL
 * @param token JWT token
 * @returns 带有认证 token 的完整 URL
 */
export function generateAuthenticatedWSUrl(baseUrl: string, token: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  } catch (error) {
    logger.error('Failed to generate authenticated WebSocket URL', error);
    throw new Error('Invalid WebSocket URL');
  }
}
