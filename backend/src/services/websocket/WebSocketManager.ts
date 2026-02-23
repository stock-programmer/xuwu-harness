import { WebSocketServer, WebSocketClient } from './WebSocketServer';
import {
  ClientMessage,
  ServerMessage,
  ExecuteModeMessage,
  SwitchModeMessage,
  RetryTaskMessage,
  CancelExecutionMessage,
  SubscribeProgressMessage,
} from '../../types/websocket.types';
import { WebSocketEventHandler } from './EventHandler';
import { ProgressTracker } from '../ProgressTracker';
import logger from '../../utils/logger';

/**
 * WebSocket Manager
 * 处理消息路由、房间管理、连接池管理
 */
export class WebSocketManager {
  private wsServer: WebSocketServer;
  private eventHandler: WebSocketEventHandler;
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set<clientId>
  private clientRooms: Map<string, Set<string>> = new Map(); // clientId -> Set<roomId>

  constructor(
    wsServer: WebSocketServer,
    progressTracker?: ProgressTracker
  ) {
    this.wsServer = wsServer;
    this.eventHandler = new WebSocketEventHandler(wsServer, progressTracker);
    logger.info('WebSocketManager initialized');
  }

  /**
   * 路由客户端消息到对应的处理器
   */
  public async handleMessage(clientId: string, message: ClientMessage): Promise<void> {
    logger.debug(`Routing message from ${clientId}`, { type: message.type });

    try {
      switch (message.type) {
        case 'execute_mode':
          await this.handleExecuteMode(clientId, message);
          break;
        case 'switch_mode':
          await this.handleSwitchMode(clientId, message);
          break;
        case 'retry_task':
          await this.handleRetryTask(clientId, message);
          break;
        case 'cancel_execution':
          await this.handleCancelExecution(clientId, message);
          break;
        case 'subscribe_progress':
          await this.handleSubscribeProgress(clientId, message);
          break;
        default:
          logger.warn(`Unknown message type from ${clientId}`, {
            type: (message as any).type,
          });
      }
    } catch (error) {
      logger.error(`Error handling message from ${clientId}:`, error);
      this.sendError(clientId, 'Failed to process message', error);
    }
  }

  /**
   * 处理执行模式请求
   */
  private async handleExecuteMode(
    clientId: string,
    message: ExecuteModeMessage
  ): Promise<void> {
    await this.eventHandler.handleExecuteMode(clientId, message);
  }

  /**
   * 处理切换模式请求
   */
  private async handleSwitchMode(
    clientId: string,
    message: SwitchModeMessage
  ): Promise<void> {
    await this.eventHandler.handleSwitchMode(clientId, message);
  }

  /**
   * 处理重试任务请求
   */
  private async handleRetryTask(
    clientId: string,
    message: RetryTaskMessage
  ): Promise<void> {
    await this.eventHandler.handleRetryTask(clientId, message);
  }

  /**
   * 处理取消执行请求
   */
  private async handleCancelExecution(
    clientId: string,
    message: CancelExecutionMessage
  ): Promise<void> {
    await this.eventHandler.handleCancelExecution(clientId, message);
  }

  /**
   * 处理订阅进度请求
   */
  private async handleSubscribeProgress(
    clientId: string,
    message: SubscribeProgressMessage
  ): Promise<void> {
    const { projectId } = message.payload;

    // 加入项目房间以接收进度更新
    this.joinRoom(clientId, `project:${projectId}`);

    // 让事件处理器处理订阅逻辑和发送当前进度
    await this.eventHandler.handleSubscribeProgress(clientId, message);
  }

  /**
   * 客户端加入房间
   */
  public joinRoom(clientId: string, roomId: string): void {
    // 添加到房间
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(clientId);

    // 记录客户端加入的房间
    if (!this.clientRooms.has(clientId)) {
      this.clientRooms.set(clientId, new Set());
    }
    this.clientRooms.get(clientId)!.add(roomId);

    logger.info(`Client ${clientId} joined room ${roomId}`, {
      roomSize: this.rooms.get(roomId)!.size,
    });
  }

  /**
   * 客户端离开房间
   */
  public leaveRoom(clientId: string, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);

      // 如果房间空了，删除房间
      if (room.size === 0) {
        this.rooms.delete(roomId);
        logger.debug(`Room ${roomId} deleted (empty)`);
      }
    }

    // 从客户端的房间列表中移除
    const clientRoomSet = this.clientRooms.get(clientId);
    if (clientRoomSet) {
      clientRoomSet.delete(roomId);

      if (clientRoomSet.size === 0) {
        this.clientRooms.delete(clientId);
      }
    }

    logger.info(`Client ${clientId} left room ${roomId}`);
  }

  /**
   * 客户端离开所有房间（用于断开连接时清理）
   */
  public leaveAllRooms(clientId: string): void {
    const clientRoomSet = this.clientRooms.get(clientId);

    if (clientRoomSet) {
      // 复制一份以避免迭代时修改
      const rooms = Array.from(clientRoomSet);
      rooms.forEach((roomId) => {
        this.leaveRoom(clientId, roomId);
      });
    }

    // Cleanup event handler resources for this client
    this.eventHandler.cleanupClient(clientId);

    logger.debug(`Client ${clientId} left all rooms`);
  }

  /**
   * 向房间中的所有客户端广播消息
   */
  public broadcastToRoom(roomId: string, message: ServerMessage): void {
    const room = this.rooms.get(roomId);

    if (!room || room.size === 0) {
      logger.debug(`Room ${roomId} is empty, skipping broadcast`);
      return;
    }

    let sentCount = 0;
    room.forEach((clientId) => {
      const success = this.wsServer.sendToClient(clientId, message);
      if (success) {
        sentCount++;
      }
    });

    logger.debug(`Broadcast to room ${roomId}: sent to ${sentCount}/${room.size} clients`);
  }

  /**
   * 获取房间中的所有客户端
   */
  public getRoomClients(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }

  /**
   * 获取客户端加入的所有房间
   */
  public getClientRooms(clientId: string): string[] {
    const rooms = this.clientRooms.get(clientId);
    return rooms ? Array.from(rooms) : [];
  }

  /**
   * 获取所有房间信息
   */
  public getRoomsInfo(): { roomId: string; clientCount: number }[] {
    const info: { roomId: string; clientCount: number }[] = [];

    this.rooms.forEach((clients, roomId) => {
      info.push({
        roomId,
        clientCount: clients.size,
      });
    });

    return info;
  }

  /**
   * 发送错误消息给客户端
   */
  private sendError(clientId: string, message: string, error: any): void {
    this.wsServer.sendToClient(clientId, {
      type: 'error',
      payload: {
        error: message,
        details: error instanceof Error ? error.message : String(error),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * 获取事件处理器（用于高级用例）
   */
  public getEventHandler(): WebSocketEventHandler {
    return this.eventHandler;
  }

  /**
   * 发送消息到客户端（便捷方法）
   */
  public sendToClient(clientId: string, message: ServerMessage): boolean {
    return this.wsServer.sendToClient(clientId, message);
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.rooms.clear();
    this.clientRooms.clear();
    this.eventHandler.cleanup();
    logger.info('WebSocketManager cleaned up');
  }
}
