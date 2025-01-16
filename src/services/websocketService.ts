import { WebSocketMessage, WebSocketConfig } from './websocket/types';
import { handleConnectionStatus } from './websocket/handlers/ConnectionHandler';
import { handleDownloadProgress } from './websocket/handlers/DownloadProgressHandler';
import { throttle } from '@/lib/utils';

const DEFAULT_CONFIG: WebSocketConfig = {
  url: 'ws://localhost:5000/admin',
  reconnectAttempts: 5,
  reconnectInterval: 1000,
  maxReconnectDelay: 30000
};

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(data: WebSocketMessage) => void>>;

  private constructor(config: WebSocketConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.messageHandlers = new Map();
    this.setupHandlers();
    this.connect();
  }

  private setupHandlers() {
    this.addHandler('connectionStatus', handleConnectionStatus);
    this.addHandler('deviceDownloadProgress', handleDownloadProgress);
  }

  private connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(this.config.url);

    this.socket.onopen = () => {
      console.log('WebSocket bağlantısı kuruldu');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message.type, message);
      } catch (error) {
        console.error('WebSocket mesaj işleme hatası:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket bağlantı hatası:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket bağlantısı kapandı');
      this.reconnect();
    };
  }

  private async reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private addHandler(type: string, handler: (message: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  private emit(type: string, data: any) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for ${type}:`, error);
        }
      });
    }
  }

  public sendMessage(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public on(type: string, handler: (data: any) => void) {
    this.addHandler(type, handler);
  }

  public off(type: string, handler: (data: any) => void) {
    this.messageHandlers.get(type)?.delete(handler);
  }

  public static getInstance(config?: WebSocketConfig): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }
}

const websocketService = WebSocketService.getInstance();
export default websocketService;