# Task: 实现 Socket.IO WebSocket 客户端封装

## 元数据
- **Task ID**: frontend-dev-plan-3.2
- **Layer**: 3
- **Dependencies**: [2.6]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
- **Estimated Complexity**: Medium

## 目标
安装 Socket.IO Client，封装 WebSocket 客户端，实现自动重连，实现事件类型定义。

## 前置条件
- 目录结构已创建（Task 2.6 完成）

## 实现步骤

### 1. 安装 Socket.IO Client
```bash
cd frontend
npm install socket.io-client
```

### 2. 创建 Socket.IO 客户端封装
创建 `src/services/websocket/socket-client.ts`：
```typescript
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connected = false;

  connect(projectId?: string): Socket {
    if (this.socket && this.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('access_token');

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: {
        token,
        projectId,
      },
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
      console.log(`WebSocket reconnect attempt ${attempt}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  emit(event: string, data: any) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
```

### 3. 创建 WebSocket 事件类型定义
创建 `src/types/websocket.types.ts`：
```typescript
// 消息类型
export interface WebSocketMessage<T = any> {
  type: 'command' | 'status' | 'output' | 'progress' | 'error';
  payload: T;
  timestamp: number;
  correlationId?: string;
}

// 输出消息
export interface OutputMessage {
  text: string;
  stream: boolean;
  type?: 'stdout' | 'stderr' | 'system';
}

// 任务状态更新
export interface TaskStatusUpdate {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

// 进度更新
export interface ProgressUpdate {
  projectId: string;
  currentLayer: number;
  totalLayers: number;
  currentTask: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  percentage: number;
}

// 文件变更通知
export interface FileChangeNotification {
  path: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
}

// 客户端事件类型
export interface ClientToServerEvents {
  'prompt:submit': (data: { mode: string; prompt: string }) => void;
  'task:start': (taskId: string) => void;
  'task:retry': (taskId: string) => void;
  'file:watch': (path: string) => void;
}

// 服务器事件类型
export interface ServerToClientEvents {
  'output:stream': (message: OutputMessage) => void;
  'task:status': (update: TaskStatusUpdate) => void;
  'layer:completed': (layer: number) => void;
  'file:changed': (change: FileChangeNotification) => void;
  'progress:update': (progress: ProgressUpdate) => void;
  error: (error: { message: string; code?: string }) => void;
}
```

### 4. 创建自定义 Hook
创建 `src/hooks/useWebSocket.ts`：
```typescript
import { useEffect, useState, useCallback } from 'react';
import { socketClient } from '@/services/websocket/socket-client';
import type { Socket } from 'socket.io-client';

export const useWebSocket = (projectId?: string) => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = socketClient.connect(projectId);
    setSocket(socketInstance);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    // 初始状态
    setConnected(socketInstance.connected);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      // 注意：不要在这里 disconnect，可能有其他组件在使用
    };
  }, [projectId]);

  const emit = useCallback(
    (event: string, data: any) => {
      socketClient.emit(event, data);
    },
    []
  );

  const subscribe = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketClient.on(event, callback);
      return () => socketClient.off(event, callback);
    },
    []
  );

  return { connected, socket, emit, subscribe };
};
```

### 5. 测试 WebSocket 连接
在组件中测试：
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

export const TestComponent: React.FC = () => {
  const { connected, emit, subscribe } = useWebSocket('project-123');

  useEffect(() => {
    const unsubscribe = subscribe('output:stream', (message) => {
      console.log('Received output:', message);
    });

    return unsubscribe;
  }, [subscribe]);

  const sendMessage = () => {
    emit('prompt:submit', {
      mode: 'prd',
      prompt: 'Test prompt',
    });
  };

  return (
    <div>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
};
```

## 期望输出
- ✅ socket.io-client 安装成功
- ✅ `src/services/websocket/socket-client.ts` 创建
- ✅ 自动重连机制实现
- ✅ `src/types/websocket.types.ts` 事件类型定义
- ✅ `src/hooks/useWebSocket.ts` 自定义 Hook 创建
- ✅ WebSocket 可以正常连接

## 验证标准
```typescript
import { socketClient } from '@/services/websocket/socket-client';

socketClient.connect();
socketClient.emit('test', { data: 'hello' });
socketClient.on('response', (data) => console.log(data));
```

## Claude 执行 Prompt

请为前端项目实现 Socket.IO WebSocket 客户端封装，具体要求如下：

1. **安装 Socket.IO Client**：
   - 安装 socket.io-client 包

2. **创建 Socket 客户端**（src/services/websocket/socket-client.ts）：
   - 创建 SocketClient 类单例
   - 配置连接选项：
     - transports: ['websocket', 'polling']
     - reconnection: true
     - reconnectionDelay: 1000ms
     - reconnectionDelayMax: 5000ms
     - reconnectionAttempts: 5
   - 实现连接管理：
     - connect(projectId) 方法
     - disconnect() 方法
     - isConnected() 方法
   - 实现事件监听：
     - on(event, callback)
     - off(event, callback)
     - emit(event, data)
   - 实现自动重连逻辑
   - 添加连接状态监听（connect/disconnect/error）

3. **创建事件类型**（src/types/websocket.types.ts）：
   - WebSocketMessage<T> 通用消息类型
   - OutputMessage 输出消息
   - TaskStatusUpdate 任务状态更新
   - ProgressUpdate 进度更新
   - FileChangeNotification 文件变更
   - ClientToServerEvents 客户端事件
   - ServerToClientEvents 服务端事件

4. **创建自定义 Hook**（src/hooks/useWebSocket.ts）：
   - useWebSocket(projectId) Hook
   - 返回：{ connected, socket, emit, subscribe }
   - 自动连接和清理
   - 提供便捷的 subscribe 方法（自动清理）

5. **环境变量配置**：
   - .env.development: VITE_WS_URL=ws://localhost:3000
   - .env.production: VITE_WS_URL=wss://api.example.com

6. **验证**：
   - 确保可以连接到 WebSocket 服务器
   - 确认自动重连工作正常
   - 确认事件订阅和发送正常

确保 WebSocket 客户端可以正常工作，自动重连机制生效，类型定义完整。
