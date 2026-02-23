/**
 * WebSocketManager 使用示例
 * 演示如何使用 WebSocketManager 进行消息路由和房间管理
 */

import http from 'http';
import { WebSocketServer } from '../services/websocket/WebSocketServer';
import { WebSocketManager } from '../services/websocket/WebSocketManager';
import logger from '../utils/logger';

// 创建 HTTP 服务器
const server = http.createServer();

// 创建 WebSocket 服务器
const wsServer = new WebSocketServer(server);

// 创建 WebSocket Manager
const wsManager = new WebSocketManager(wsServer);

// 模拟客户端连接和消息处理
async function testWebSocketManager() {
  logger.info('=== WebSocket Manager 测试开始 ===');

  // 测试 1: 模拟房间管理
  logger.info('\n--- 测试房间管理 ---');

  const client1 = 'client-1';
  const client2 = 'client-2';
  const projectRoom = 'project:test-project-123';

  // 客户端加入房间
  wsManager.joinRoom(client1, projectRoom);
  wsManager.joinRoom(client2, projectRoom);

  // 查看房间信息
  const roomClients = wsManager.getRoomClients(projectRoom);
  logger.info(`房间 ${projectRoom} 中的客户端:`, roomClients);

  // 广播消息到房间
  const progressMessage: any = {
    type: 'task_progress',
    payload: {
      projectId: 'test-project-123',
      currentLayer: 1,
      totalLayers: 5,
      currentTask: 'task-1.1',
      taskStatus: 'running',
      completedTasks: 0,
      totalTasks: 10,
      percentage: 10,
    },
  };
  wsManager.broadcastToRoom(projectRoom, progressMessage);

  // 客户端离开房间
  wsManager.leaveRoom(client1, projectRoom);

  const roomClientsAfterLeave = wsManager.getRoomClients(projectRoom);
  logger.info(`客户端 ${client1} 离开后，房间中的客户端:`, roomClientsAfterLeave);

  // 测试 2: 模拟消息路由
  logger.info('\n--- 测试消息路由 ---');

  // 模拟执行模式消息
  wsManager.handleMessage(client2, {
    type: 'execute_mode',
    payload: {
      mode: 'dev-layer-by-layer',
      input: 'context/dev-tasks/backend/tasks-index.json',
    },
  });

  // 模拟订阅进度消息
  wsManager.handleMessage(client2, {
    type: 'subscribe_progress',
    payload: {
      projectId: 'test-project-456',
    },
  });

  // 查看客户端加入的所有房间
  const client2Rooms = wsManager.getClientRooms(client2);
  logger.info(`客户端 ${client2} 加入的房间:`, client2Rooms);

  // 测试 3: 获取所有房间信息
  logger.info('\n--- 所有房间信息 ---');
  const allRooms = wsManager.getRoomsInfo();
  logger.info('所有房间:', allRooms);

  // 清理
  wsManager.leaveAllRooms(client2);
  logger.info('\n--- 清理后的房间信息 ---');
  const roomsAfterCleanup = wsManager.getRoomsInfo();
  logger.info('清理后的房间:', roomsAfterCleanup);

  logger.info('\n=== WebSocket Manager 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  testWebSocketManager()
    .then(() => {
      logger.info('测试成功完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('测试失败:', error);
      process.exit(1);
    });
}

export { testWebSocketManager };
