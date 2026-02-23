import { io, Socket } from 'socket.io-client';
import type { WebSocketEvent, WebSocketMessageHandler } from '@/types/websocket.types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to WebSocket server
   */
  connect(projectId?: string): Socket {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const query = projectId ? { projectId } : {};

    this.socket = io(wsUrl, {
      query,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to a WebSocket event
   */
  on<T = any>(event: WebSocketEvent | string, handler: WebSocketMessageHandler<T>): void {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }
    this.socket.on(event, handler);
  }

  /**
   * Unsubscribe from a WebSocket event
   */
  off<T = any>(event: WebSocketEvent | string, handler?: WebSocketMessageHandler<T>): void {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Emit a WebSocket event
   */
  emit(event: string, data?: any): void {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get the socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after maximum attempts');
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
