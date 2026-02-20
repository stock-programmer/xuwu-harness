# Task: 实现 WebSocket 事件处理

## 元数据
- **Task ID**: backend-5.2
- **Layer**: 5
- **Dependencies**: [4.2]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4]
- **Estimated Complexity**: Medium

## 目标
实现 WebSocket 消息的事件处理和命令分发，连接业务逻辑层。

## 实现步骤

### 1. 创建事件处理器
创建 `src/services/websocket/EventHandler.ts`：
```typescript
import { WebSocketManager } from './WebSocketManager';
import { ClientMessage } from '@/types/websocket.types';
import { workflowOrchestrator } from '../workflow/WorkflowOrchestrator';
import logger from '@/utils/logger';

export class WebSocketEventHandler {
  constructor(private wsManager: WebSocketManager) {}

  async handleExecuteMode(clientId: string, message: any): Promise<void> {
    const { mode, input } = message.payload;

    try {
      const result = await workflowOrchestrator.executeMode(mode, input);

      this.wsManager.send(clientId, {
        type: 'mode_execution_result',
        payload: result,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Execute mode error:', error);
      // 发送错误消息
    }
  }
}
```

## Claude 执行 Prompt

请实现 WebSocket 事件处理：处理客户端命令，调用业务逻辑，返回结果。
