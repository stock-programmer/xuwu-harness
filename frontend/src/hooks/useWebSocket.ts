import { useEffect, useState, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
}

interface UseWebSocketReturn {
  connected: boolean;
  socket: WebSocket | null;
  emit: (event: string, data?: unknown) => void;
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

type MessageHandler = (data: unknown) => void;

export const useWebSocket = (
  projectId?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    autoConnect = true,
    reconnect = true,
    reconnectionDelay = 1000,
    reconnectionAttempts = 5,
  } = options;

  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const eventHandlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    console.log('[WebSocket] connectWebSocket called', {
      projectId,
      currentState: socketRef.current?.readyState
    });

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected, skipping');
      return;
    }

    // Get WebSocket URL from environment
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const url = projectId ? `${wsUrl}/ws?projectId=${projectId}` : `${wsUrl}/ws`;

    console.log('[WebSocket] Attempting to connect to:', url);
    console.log('[WebSocket] Environment VITE_WS_URL:', import.meta.env.VITE_WS_URL);

    try {
      const socket = new WebSocket(url);
      console.log('[WebSocket] WebSocket instance created, readyState:', socket.readyState);

      socket.onopen = () => {
        console.log('[WebSocket] ✓ Connected successfully!');
        console.log('[WebSocket] ReadyState:', socket.readyState);
        setConnected(true);
        reconnectCountRef.current = 0;
        clearReconnectTimer();
      };

      socket.onclose = (event) => {
        console.log('[WebSocket] ✗ Connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setConnected(false);

        // Auto reconnect if enabled
        if (reconnect && reconnectCountRef.current < reconnectionAttempts) {
          reconnectCountRef.current++;
          console.log(
            `[WebSocket] Reconnecting... (${reconnectCountRef.current}/${reconnectionAttempts})`
          );

          reconnectTimerRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectionDelay);
        } else if (reconnectCountRef.current >= reconnectionAttempts) {
          console.error('[WebSocket] ✗ Max reconnection attempts reached');
        }
      };

      socket.onerror = (error) => {
        console.error('[WebSocket] ✗ Connection error:', error);
        console.error('[WebSocket] Error details:', {
          type: error.type,
          target: error.target,
        });
        setConnected(false);
      };

      socket.onmessage = (event) => {
        console.log('[WebSocket] ← Received message:', event.data);
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;
          console.log('[WebSocket] Parsed message type:', type);

          // Dispatch to registered handlers
          const handlers = eventHandlersRef.current.get(type);
          if (handlers && handlers.size > 0) {
            console.log(`[WebSocket] Dispatching to ${handlers.size} handler(s) for type: ${type}`);
            handlers.forEach((handler) => {
              try {
                handler(payload);
              } catch (error) {
                console.error(`[WebSocket] Error in handler for ${type}:`, error);
              }
            });
          } else {
            console.warn(`[WebSocket] No handlers registered for message type: ${type}`);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
          console.error('[WebSocket] Raw message:', event.data);
        }
      };

      socketRef.current = socket;
      console.log('[WebSocket] Socket reference stored');
    } catch (error) {
      console.error('[WebSocket] ✗ Failed to create connection:', error);
      setConnected(false);
    }
  }, [projectId, reconnect, reconnectionDelay, reconnectionAttempts, clearReconnectTimer]);

  useEffect(() => {
    if (autoConnect) {
      connectWebSocket();
    }

    return () => {
      clearReconnectTimer();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [autoConnect, connectWebSocket, clearReconnectTimer]);

  const emit = useCallback((event: string, data?: unknown) => {
    console.log('[WebSocket] → Sending message:', { event, data });
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: event,
        payload: data,
        timestamp: Date.now(),
      };
      console.log('[WebSocket] Serialized message:', JSON.stringify(message));
      socketRef.current.send(JSON.stringify(message));
      console.log('[WebSocket] ✓ Message sent successfully');
    } else {
      console.warn('[WebSocket] ✗ Cannot emit, socket not connected. ReadyState:', socketRef.current?.readyState);
    }
  }, []);

  const subscribe = useCallback(<T = unknown,>(event: string, handler: (data: T) => void) => {
    const typedHandler = handler as MessageHandler;
    console.log('[WebSocket] Subscribing to event:', event);

    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
      console.log('[WebSocket] Created new handler set for event:', event);
    }

    eventHandlersRef.current.get(event)!.add(typedHandler);
    const totalHandlers = eventHandlersRef.current.get(event)!.size;
    console.log(`[WebSocket] Handler registered. Total handlers for '${event}':`, totalHandlers);

    // Return unsubscribe function
    return () => {
      console.log('[WebSocket] Unsubscribing from event:', event);
      const handlers = eventHandlersRef.current.get(event);
      if (handlers) {
        handlers.delete(typedHandler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(event);
          console.log('[WebSocket] Removed handler set for event:', event);
        }
      }
    };
  }, []);

  const connect = useCallback(() => {
    reconnectCountRef.current = 0;
    connectWebSocket();
  }, [connectWebSocket]);

  const disconnect = useCallback(() => {
    clearReconnectTimer();
    reconnectCountRef.current = reconnectionAttempts; // Prevent auto reconnect
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setConnected(false);
  }, [clearReconnectTimer, reconnectionAttempts]);

  return {
    connected,
    socket: socketRef.current,
    emit,
    subscribe,
    connect,
    disconnect,
  };
};
