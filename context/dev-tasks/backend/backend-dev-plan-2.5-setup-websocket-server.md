# Task: 实现 WebSocket 服务器基础

## 元数据
- **Task ID**: backend-2.5
- **Layer**: 2
- **Dependencies**: [1.1, 2.4]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: High

## 目标
创建 WebSocket 服务器，实现连接管理、心跳机制、会话管理，为实时双向通信打好基础。

## 前置条件
- ws 库已安装（Task 1.1）
- Express 服务器已创建（Task 2.4）

## 实现步骤

### 1. 创建 WebSocket 服务器类
创建 `src/services/websocket/WebSocketServer.ts`：
```typescript
import { Server as HTTPServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';

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

  constructor(server: HTTPServer) {
    // 创建 WebSocket 服务器
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
    });

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
  private handleMessage(clientId: string, data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());

      logger.debug(`WebSocket message from ${clientId}:`, {
        type: message.type,
      });

      // TODO: 路由消息到对应处理器
      // 现在只是记录日志
    } catch (error) {
      logger.error(`Failed to parse WebSocket message from ${clientId}:`, error);
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
```

### 2. 集成到主应用
在 `src/index.ts` 中添加：
```typescript
import { WebSocketServer } from './services/websocket/WebSocketServer';

// 在 bootstrap() 函数中
const wsServer = new WebSocketServer(server);

// 在优雅关闭中
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  wsServer.close();
  server.close(() => {
    logger.info('Servers closed');
    process.exit(0);
  });
});
```

## 期望输出

### 新增文件
- `src/services/websocket/WebSocketServer.ts`

### WebSocket 功能
- 连接管理（Map 存储客户端）
- 心跳机制（30 秒间隔）
- 消息发送（单播、广播）
- 连接生命周期管理

## 验证标准

### 1. 服务器启动验证
```bash
npm run dev
```
日志应显示 "WebSocket server initialized on path /ws"

### 2. 连接测试（使用 wscat）
```bash
npm install -g wscat
wscat -c ws://localhost:3000/ws
```
应收到欢迎消息

### 3. 心跳测试
保持连接超过 30 秒，应该收到 ping 消息

### 4. 断开测试
关闭 wscat，服务器日志应显示断开信息

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/services/websocket/WebSocketServer.ts：
   - 定义 WebSocketClient 接口
   - 实现 WebSocketServer 类：
     * 构造函数：初始化 wss，监听连接，启动心跳
     * handleConnection()：处理新连接，生成客户端 ID
     * handleMessage()：处理客户端消息（现在只记录日志）
     * handleDisconnection()：处理断开连接
     * heartbeat()：30秒间隔心跳检测
     * sendToClient()：发送消息给指定客户端
     * broadcast()：广播消息给所有客户端
     * getClients()、getClientCount()：获取客户端信息
     * close()：关闭服务器

2. 在 src/index.ts 中集成 WebSocket：
   - 创建 WebSocketServer 实例
   - 在优雅关闭中调用 wsServer.close()

3. 验证 WebSocket 服务器：
   - 启动服务器
   - 使用 wscat 连接测试
   - 验证心跳机制
   - 验证断开连接

确保 WebSocket 服务器基础完整、心跳机制正常、连接管理可靠。
