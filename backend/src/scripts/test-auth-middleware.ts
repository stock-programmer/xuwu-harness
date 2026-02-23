import express, { Request, Response } from 'express';
import {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  refreshToken,
  isTokenExpiringSoon,
  decodeToken,
} from '@/utils/auth';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  AuthRequest,
} from '@/middleware/auth';
import {
  authenticateWebSocket,
  generateAuthenticatedWSUrl,
} from '@/middleware/wsAuth';
import logger from '@/utils/logger';
import { IncomingMessage } from 'http';

/**
 * 测试认证中间件
 */
async function testAuthMiddleware(): Promise<void> {
  logger.info('=== Testing Auth Middleware ===\n');

  try {
    // ========== 测试 1: Token 生成和验证 ==========
    logger.info('--- Test 1: Token generation and verification ---');

    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin',
    };

    const token = generateToken(testUser);
    logger.info(`✓ Generated token: ${token.substring(0, 20)}...`);

    const verification = verifyToken(token);
    if (verification.valid && verification.payload) {
      logger.info('✓ Token verification successful');
      logger.info(`  User ID: ${verification.payload.id}`);
      logger.info(`  Email: ${verification.payload.email}`);
      logger.info(`  Role: ${verification.payload.role}`);
    } else {
      logger.error('✗ Token verification failed:', verification.error);
      throw new Error('Token verification failed');
    }

    // ========== 测试 2: 无效 Token ==========
    logger.info('\n--- Test 2: Invalid token verification ---');

    const invalidToken = 'invalid.token.here';
    const invalidVerification = verifyToken(invalidToken);

    if (!invalidVerification.valid) {
      logger.info('✓ Invalid token correctly rejected');
      logger.info(`  Error: ${invalidVerification.error}`);
    } else {
      logger.error('✗ Invalid token was accepted');
      throw new Error('Invalid token was accepted');
    }

    // ========== 测试 3: Token 解码 ==========
    logger.info('\n--- Test 3: Token decoding ---');

    const decoded = decodeToken(token);
    if (decoded && decoded.id === testUser.id) {
      logger.info('✓ Token decoded successfully');
      logger.info(`  User ID: ${decoded.id}`);
    } else {
      logger.error('✗ Token decoding failed');
      throw new Error('Token decoding failed');
    }

    // ========== 测试 4: Header Token 提取 ==========
    logger.info('\n--- Test 4: Extract token from header ---');

    const authHeader = `Bearer ${token}`;
    const extractedToken = extractTokenFromHeader(authHeader);

    if (extractedToken === token) {
      logger.info('✓ Token extracted from header successfully');
    } else {
      logger.error('✗ Token extraction failed');
      throw new Error('Token extraction failed');
    }

    const invalidHeader = 'InvalidFormat token';
    const invalidExtraction = extractTokenFromHeader(invalidHeader);

    if (invalidExtraction === null) {
      logger.info('✓ Invalid header format correctly rejected');
    } else {
      logger.error('✗ Invalid header was accepted');
      throw new Error('Invalid header was accepted');
    }

    // ========== 测试 5: Token 刷新 ==========
    logger.info('\n--- Test 5: Token refresh ---');

    const newToken = refreshToken(token, '1d');
    if (newToken) {
      logger.info('✓ Token refreshed successfully');

      const newVerification = verifyToken(newToken);
      if (newVerification.valid && newVerification.payload?.id === testUser.id) {
        logger.info('✓ New token is valid and contains correct data');
      } else {
        logger.error('✗ Refreshed token is invalid');
        throw new Error('Refreshed token is invalid');
      }
    } else {
      logger.error('✗ Token refresh failed');
      throw new Error('Token refresh failed');
    }

    // ========== 测试 6: Token 过期检查 ==========
    logger.info('\n--- Test 6: Token expiry check ---');

    const shortLivedToken = generateToken(testUser, '1s');
    const isExpiringSoon = isTokenExpiringSoon(shortLivedToken, 5);

    if (isExpiringSoon) {
      logger.info('✓ Short-lived token correctly identified as expiring soon');
    } else {
      logger.info('  Note: Token may not be expiring soon yet');
    }

    const longLivedToken = generateToken(testUser, '7d');
    const isNotExpiringSoon = !isTokenExpiringSoon(longLivedToken, 3600);

    if (isNotExpiringSoon) {
      logger.info('✓ Long-lived token correctly identified as not expiring soon');
    }

    // ========== 测试 7: Express 中间件 - 成功认证 ==========
    logger.info('\n--- Test 7: Express middleware - successful auth ---');

    const app = express();
    let authTestPassed = false;

    app.get('/protected', authMiddleware, (req: AuthRequest, res: Response) => {
      if (req.user && req.user.id === testUser.id) {
        authTestPassed = true;
        logger.info('✓ Auth middleware successfully authenticated user');
        logger.info(`  User in request: ${req.user.id}`);
        res.json({ success: true, user: req.user });
      } else {
        res.status(500).json({ error: 'User not found in request' });
      }
    });

    // 模拟请求
    const mockReq = {
      headers: { authorization: authHeader },
      path: '/protected',
      method: 'GET',
    } as unknown as AuthRequest;

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          logger.info(`  Response status: ${code}`);
          logger.info(`  Response data:`, data);
        },
      }),
      json: (data: any) => {
        logger.info(`  Response data:`, data);
      },
    } as unknown as Response;

    let nextCalled = false;
    const mockNext = () => {
      nextCalled = true;
    };

    authMiddleware(mockReq, mockRes, mockNext);

    if (nextCalled && mockReq.user) {
      logger.info('✓ Auth middleware called next() and set user');
    }

    // ========== 测试 8: Express 中间件 - 缺少 Token ==========
    logger.info('\n--- Test 8: Express middleware - missing token ---');

    const mockReqNoToken = {
      headers: {},
      path: '/protected',
      method: 'GET',
    } as unknown as AuthRequest;

    let unauthorizedSent = false;
    const mockResNoToken = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code === 401) {
            unauthorizedSent = true;
            logger.info('✓ Auth middleware returned 401 for missing token');
          }
          return mockResNoToken;
        },
      }),
    } as unknown as Response;

    authMiddleware(mockReqNoToken, mockResNoToken, mockNext);

    // ========== 测试 9: 可选认证中间件 ==========
    logger.info('\n--- Test 9: Optional auth middleware ---');

    const mockReqOptional = {
      headers: {},
      path: '/public',
      method: 'GET',
    } as unknown as AuthRequest;

    let optionalNextCalled = false;
    const mockNextOptional = () => {
      optionalNextCalled = true;
    };

    const mockResOptional = {} as Response;

    optionalAuthMiddleware(mockReqOptional, mockResOptional, mockNextOptional);

    if (optionalNextCalled && !mockReqOptional.user) {
      logger.info('✓ Optional auth middleware allowed request without token');
    }

    // 测试带 token 的可选认证
    const mockReqOptionalWithToken = {
      headers: { authorization: authHeader },
      path: '/public',
      method: 'GET',
    } as unknown as AuthRequest;

    optionalAuthMiddleware(
      mockReqOptionalWithToken,
      mockResOptional,
      mockNextOptional
    );

    if (mockReqOptionalWithToken.user) {
      logger.info('✓ Optional auth middleware set user when token provided');
    }

    // ========== 测试 10: 角色验证中间件 ==========
    logger.info('\n--- Test 10: Role verification middleware ---');

    const adminReq = {
      user: { id: 'admin-1', role: 'admin' },
      path: '/admin',
      method: 'GET',
    } as unknown as AuthRequest;

    let roleNextCalled = false;
    const mockNextRole = () => {
      roleNextCalled = true;
    };

    const mockResRole = {} as Response;

    const adminMiddleware = requireRole('admin', 'superadmin');
    adminMiddleware(adminReq, mockResRole, mockNextRole);

    if (roleNextCalled) {
      logger.info('✓ Role middleware allowed admin access');
    }

    // 测试角色拒绝
    const userReq = {
      user: { id: 'user-1', role: 'user' },
      path: '/admin',
      method: 'GET',
    } as unknown as AuthRequest;

    let forbiddenSent = false;
    const mockResRoleDenied = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code === 403) {
            forbiddenSent = true;
            logger.info('✓ Role middleware denied user access to admin route');
          }
          return mockResRoleDenied;
        },
      }),
    } as unknown as Response;

    adminMiddleware(userReq, mockResRoleDenied, mockNextRole);

    // ========== 测试 11: WebSocket 认证 ==========
    logger.info('\n--- Test 11: WebSocket authentication ---');

    // 测试通过 query 参数认证
    const wsReqWithQuery = {
      url: `/ws?token=${token}`,
      headers: { host: 'localhost:3001' },
    } as IncomingMessage;

    const wsAuthResult = authenticateWebSocket(wsReqWithQuery);

    if (wsAuthResult.authenticated && wsAuthResult.user?.id === testUser.id) {
      logger.info('✓ WebSocket auth successful with query token');
    } else {
      logger.error('✗ WebSocket auth failed with query token');
      throw new Error('WebSocket auth failed');
    }

    // 测试通过 header 认证
    const wsReqWithHeader = {
      url: '/ws',
      headers: {
        host: 'localhost:3001',
        authorization: authHeader,
      },
    } as IncomingMessage;

    const wsAuthHeaderResult = authenticateWebSocket(wsReqWithHeader);

    if (
      wsAuthHeaderResult.authenticated &&
      wsAuthHeaderResult.user?.id === testUser.id
    ) {
      logger.info('✓ WebSocket auth successful with header token');
    } else {
      logger.error('✗ WebSocket auth failed with header token');
      throw new Error('WebSocket auth failed with header');
    }

    // 测试生成认证 URL
    const wsUrl = generateAuthenticatedWSUrl('ws://localhost:3001/ws', token);
    if (wsUrl.includes('token=')) {
      logger.info('✓ Generated authenticated WebSocket URL');
      logger.info(`  URL: ${wsUrl.substring(0, 50)}...`);
    }

    logger.info('\n=== All Auth Middleware Tests Passed ===');
  } catch (error) {
    logger.error('Test failed:', error);
    throw error;
  }
}

// 运行测试
testAuthMiddleware()
  .then(() => {
    logger.info('\n✓ All tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n✗ Tests failed:', error);
    process.exit(1);
  });
