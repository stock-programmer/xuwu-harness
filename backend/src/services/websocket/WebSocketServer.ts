import { Server as HTTPServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { WebSocketEventHandler } from './EventHandler';
import { ClientMessage } from '../../types/websocket.types';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  projectId?: string;
  connectedAt: Date;
}

export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocketClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private eventHandler?: WebSocketEventHandler;

  constructor(server: HTTPServer, eventHandler?: WebSocketEventHandler) {
    // 创建 WebSocket 服务器
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
    });

    this.eventHandler = eventHandler;

    logger.info('WebSocket server initialized on path /ws');

    // 监听连接
    this.wss.on('connection', this.handleConnection.bind(this));

    // 启动心跳检测
    this.heartbeatInterval = setInterval(
      this.heartbeat.bind(this),
      30000 // 每 30 秒
    );
  }

  /**
   * 处理新连接
   */
  private handleConnection(ws: WebSocket, req: any) {
    const clientId = uuidv4();

    const client: WebSocketClient = {
      id: clientId,
      ws,
      isAlive: true,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    logger.info(`WebSocket client connected: ${clientId}`, {
      ip: req.socket.remoteAddress,
      totalClients: this.clients.size,
    });

    // 发送欢迎消息
    this.sendToClient(clientId, {
      type: 'connected',
      payload: {
        clientId,
        message: 'Connected to Claude Code Harness',
      },
      timestamp: Date.now(),
    });

    // 监听 pong 响应
    ws.on('pong', () => {
      if (this.clients.has(clientId)) {
        this.clients.get(clientId)!.isAlive = true;
      }
    });

    // 监听消息
    ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(clientId, data);
    });

    // 监听关闭
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // 监听错误
    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
    });
  }

  /**
   * 处理客户端消息
   */
  private async handleMessage(clientId: string, data: WebSocket.Data) {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      logger.debug(`WebSocket message from ${clientId}:`, {
        type: message.type,
      });

      // 如果没有 EventHandler，只记录日志
      if (!this.eventHandler) {
        logger.warn('No EventHandler configured, message ignored:', message.type);
        return;
      }

      // 路由消息到对应的处理器
      switch (message.type) {
        case 'execute_mode':
          await this.eventHandler.handleExecuteMode(clientId, message);
          break;

        case 'switch_mode':
          await this.eventHandler.handleSwitchMode(clientId, message);
          break;

        case 'retry_task':
          await this.eventHandler.handleRetryTask(clientId, message);
          break;

        case 'cancel_execution':
          await this.eventHandler.handleCancelExecution(clientId, message);
          break;

        case 'subscribe_progress':
          await this.eventHandler.handleSubscribeProgress(clientId, message);
          break;

        default:
          // TypeScript infers 'never' here since all valid cases are handled
          // Cast to any to handle unexpected message types at runtime
          const unknownMessage = message as any;
          logger.warn(`Unknown message type: ${unknownMessage.type}`);
          this.sendToClient(clientId, {
            type: 'error',
            payload: {
              error: `Unknown message type: ${unknownMessage.type}`,
            },
            timestamp: Date.now(),
          });
      }
    } catch (error) {
      logger.error(`Failed to handle WebSocket message from ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        payload: {
          error: 'Failed to process message',
          details: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(clientId: string) {
    const client = this.clients.get(clientId);

    if (client) {
      this.clients.delete(clientId);

      logger.info(`WebSocket client disconnected: ${clientId}`, {
        duration: Date.now() - client.connectedAt.getTime(),
        totalClients: this.clients.size,
      });
    }
  }

  /**
   * 心跳检测
   */
  private heartbeat() {
    const deadClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (!client.isAlive) {
        // 客户端未响应 pong，标记为死连接
        deadClients.push(clientId);
        client.ws.terminate();
        return;
      }

      // 标记为待检测，发送 ping
      client.isAlive = false;
      client.ws.ping();
    });

    // 移除死连接
    deadClients.forEach((clientId) => {
      this.clients.delete(clientId);
      logger.warn(`WebSocket client ${clientId} terminated due to no heartbeat`);
    });
  }

  /**
   * 发送消息给指定客户端
   */
  public sendToClient(clientId: string, message: any): boolean {
    const client = this.clients.get(clientId);

    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      logger.warn(`Cannot send message to client ${clientId}: not connected`);
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}:`, error);
      return false;
    }
  }

  /**
   * 广播消息给所有客户端
   */
  public broadcast(message: any, excludeClientId?: string) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }

      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
          sentCount++;
        } catch (error) {
          logger.error(`Failed to broadcast to client ${clientId}:`, error);
        }
      }
    });

    logger.debug(`Broadcast message to ${sentCount} clients`);
  }

  /**
   * 获取所有连接的客户端
   */
  public getClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * 获取连接数
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 设置事件处理器（用于延迟初始化）
   */
  public setEventHandler(eventHandler: WebSocketEventHandler): void {
    this.eventHandler = eventHandler;
    logger.info('EventHandler configured for WebSocketServer');
  }

  /**
   * 关闭 WebSocket 服务器
   */
  public close() {
    clearInterval(this.heartbeatInterval);

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.wss.close();

    logger.info('WebSocket server closed');
  }
}
