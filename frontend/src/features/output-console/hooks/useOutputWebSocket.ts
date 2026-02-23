import { useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useOutputConsoleStore } from '../store/output-console.store';

export const useOutputWebSocket = () => {
  const { connected, subscribe } = useWebSocketContext();
  const { addLog } = useOutputConsoleStore();

  console.log('[useOutputWebSocket] Hook called', { connected });

  useEffect(() => {
    console.log('[useOutputWebSocket] useEffect triggered', { connected });

    if (!connected) {
      console.warn('[useOutputWebSocket] Not connected, skipping handler registration');
      return;
    }

    console.log('[useOutputWebSocket] Registering event handlers...');

    // Listen to Claude Code real-time output
    const unsubscribeClaudeOutput = subscribe<{ text: string; stream: boolean }>(
      'claude_output',
      (payload) => {
        console.log('[useOutputWebSocket] claude_output handler called', payload);
        addLog({
          level: 'info',
          message: payload.text,
          source: 'claude',
        });
      }
    );

    // Listen to status messages
    const unsubscribeStatus = subscribe<any>('status', (payload) => {
      console.log('[useOutputWebSocket] status handler called', payload);
      const level = payload.error ? 'error' : payload.success === false ? 'warn' : 'info';
      addLog({
        level,
        message: payload.message || JSON.stringify(payload),
        source: 'system',
        metadata: payload,
      });
    });

    // Listen to errors
    const unsubscribeError = subscribe<{ error: string; details?: string }>('error', (payload) => {
      console.log('[useOutputWebSocket] error handler called', payload);
      addLog({
        level: 'error',
        message: payload.error,
        source: 'system',
        metadata: payload,
      });
    });

    // Listen to execution errors
    const unsubscribeExecutionError = subscribe<{ error: string; taskId?: string }>(
      'execution_error',
      (payload) => {
        console.log('[useOutputWebSocket] execution_error handler called', payload);
        addLog({
          level: 'error',
          message: `执行错误: ${payload.error}`,
          source: 'execution',
          metadata: payload,
        });
      }
    );

    // Listen to task progress
    const unsubscribeTaskProgress = subscribe<any>('task_progress', (payload) => {
      console.log('[useOutputWebSocket] task_progress handler called', payload);
      addLog({
        level: 'info',
        message: `任务进度: ${payload.percentage || 0}%`,
        source: 'task',
        metadata: payload,
      });
    });

    console.log('[useOutputWebSocket] ✓ All event handlers registered');

    return () => {
      console.log('[useOutputWebSocket] Cleaning up event handlers');
      unsubscribeClaudeOutput();
      unsubscribeStatus();
      unsubscribeError();
      unsubscribeExecutionError();
      unsubscribeTaskProgress();
    };
  }, [connected, subscribe, addLog]);
};
