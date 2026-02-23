import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketContextValue {
  connected: boolean;
  socket: WebSocket | null;
  emit: (event: string, data?: unknown) => void;
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  projectId?: string;
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ projectId, children }) => {
  const websocket = useWebSocket(projectId);

  console.log('[WebSocketProvider] Providing WebSocket context', {
    projectId,
    connected: websocket.connected,
  });

  return <WebSocketContext.Provider value={websocket}>{children}</WebSocketContext.Provider>;
};

export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }

  return context;
};
