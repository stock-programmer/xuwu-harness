# Task: 实现 WebSocket Manager（消息管理器）

## 元数据
- **Task ID**: backend-4.2
- **Layer**: 4
- **Dependencies**: [2.5, 2.3]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4, 4.5]
- **Estimated Complexity**: High

## 目标
实现 WebSocket 消息管理器，处理消息路由、房间管理、连接池管理，支持实时双向通信。

## 前置条件
- WebSocket 服务器基础已实现（Task 2.5）
- TypeScript 类型已定义（Task 2.3）

## 实现步骤

### 1. 创建 WebSocket Manager
创建 `src/services/websocket/WebSocketManager.ts`：
```typescript
import { WebSocketServer, WebSocketClient } from './WebSocketServer';
import { WebSocketMessage, ClientMessage, ServerMessage } from '@/types/websocket.types';
import logger from '@/utils/logger';

export class WebSocketManager {
  private wsServer: WebSocketServer;
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set<clientId>

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  /**
   * 路由客户端消息
   */
  handleMessage(clientId: string, message: ClientMessage): void {
    logger.debug(`Routing message from ${clientId}`, { type: message.type });

    switch (message.type) {
      case 'execute_mode':
        this.handleExecuteMode(clientId, message);
        break;
      case 'subscribe_progress':
        this.handleSubscribeProgress(clientId, message);
        break;
      // ...其他消息类型
    }
  }

  /**
   * 加入房间（用于进度订阅）
   */
  joinRoom(clientId: string, roomId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(clientId);
    logger.info(`Client ${clientId} joined room ${roomId}`);
  }

  /**
   * 离开房间
   */
  leaveRoom(clientId: string, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * 向房间广播
   */
  broadcastToRoom(roomId: string, message: ServerMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach((clientId) => {
      this.wsServer.sendToClient(clientId, message);
    });
  }
}
```

## 验证标准

测试消息路由、房间管理、广播功能。

## Claude 执行 Prompt

请实现 WebSocket Manager：创建消息路由、房间管理、广播功能。
