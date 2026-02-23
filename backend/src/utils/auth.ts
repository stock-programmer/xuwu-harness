import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import logger from '@/utils/logger';

/**
 * JWT Payload 接口
 */
export interface JWTPayload {
  id: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Token 验证结果
 */
export interface TokenVerificationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * 生成 JWT token
 * @param payload Token 载荷数据
 * @param expiresIn 过期时间（可选，默认使用配置）
 * @returns JWT token 字符串
 */
export function generateToken(
  payload: JWTPayload,
  expiresIn?: string | number
): string {
  try {
    const expiry = (expiresIn || config.jwt.expiresIn) as string | number;
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: expiry as any });

    logger.debug('Token generated successfully', {
      userId: payload.id,
      expiresIn: expiry,
    });

    return token;
  } catch (error) {
    logger.error('Failed to generate token', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * 验证 JWT token
 * @param token JWT token 字符串
 * @returns 验证结果对象
 */
export function verifyToken(token: string): TokenVerificationResult {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token verification failed: Token expired');
      return {
        valid: false,
        error: 'Token expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Token verification failed: Invalid token', {
        error: error.message,
      });
      return {
        valid: false,
        error: 'Invalid token',
      };
    }

    logger.error('Token verification failed: Unexpected error', error);
    return {
      valid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * 解码 JWT token（不验证签名）
 * 用于获取 token 信息而不验证其有效性
 * @param token JWT token 字符串
 * @returns 解码后的 payload 或 null
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded;
  } catch (error) {
    logger.error('Failed to decode token', error);
    return null;
  }
}

/**
 * 从 Authorization header 中提取 token
 * @param authHeader Authorization header 字符串
 * @returns Token 字符串或 null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 刷新 token
 * 生成一个新的 token，保持相同的 payload
 * @param oldToken 旧的 JWT token
 * @param expiresIn 新 token 的过期时间（可选）
 * @returns 新的 JWT token 或 null
 */
export function refreshToken(
  oldToken: string,
  expiresIn?: string | number
): string | null {
  try {
    // 解码旧 token（不验证，因为可能已过期）
    const decoded = decodeToken(oldToken);

    if (!decoded) {
      logger.warn('Cannot refresh token: Failed to decode old token');
      return null;
    }

    // 移除标准 JWT 字段
    const { iat, exp, nbf, ...payload } = decoded;

    // 生成新 token
    return generateToken(payload as JWTPayload, expiresIn);
  } catch (error) {
    logger.error('Failed to refresh token', error);
    return null;
  }
}

/**
 * 检查 token 是否即将过期
 * @param token JWT token
 * @param thresholdSeconds 过期阈值（秒），默认 1 小时
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdSeconds: number = 3600
): boolean {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
      return false;
    }

    const expiresAt = decoded.exp * 1000; // 转换为毫秒
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    return timeUntilExpiry < thresholdSeconds * 1000;
  } catch (error) {
    logger.error('Failed to check token expiry', error);
    return false;
  }
}
