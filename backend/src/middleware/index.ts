// Export authentication middleware
export {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  AuthRequest,
} from './auth';

// Export WebSocket authentication
export {
  authenticateWebSocket,
  wsAuthMiddleware,
  generateAuthenticatedWSUrl,
  WSAuthResult,
} from './wsAuth';
