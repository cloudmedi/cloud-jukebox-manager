import { handleDeviceStatusMessage } from './websocket/handlers/DeviceStatusHandler';
import { handleInitialStateMessage } from './websocket/handlers/InitialStateHandler';
import { handleDeviceDelete } from './websocket/handlers/DeviceDeleteHandler';
import { handleDownloadProgress } from './websocket/handlers/DownloadProgressHandler';
import { MessageHandler } from './websocket/WebSocketConfig';
import { toast } from "sonner";

class WebSocketService {
  private static instance: WebSocketService;
  private messageHandlers: Map<string, Set<MessageHandler>>;
  private ws: WebSocket | null = null;
  private token: string | null = null;

  private constructor() {
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    this.addMessageHandler('delete', handleDeviceDelete);
    this.addMessageHandler('deviceStatus', handleDeviceStatusMessage);
    this.addMessageHandler('initialState', handleInitialStateMessage);
    this.addMessageHandler('downloadProgress', handleDownloadProgress);
    this.addMessageHandler('playlist', this.handlePlaylistMessage.bind(this));
  }

  private handlePlaylistMessage(message: any) {
    console.log('Handling playlist message:', message);
    // Add any specific playlist message handling logic here
    toast.success('Playlist güncellendi');
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public setToken(token: string) {
    console.log('Setting token:', token);
    this.token = token;
    this.connect();
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket...');
    this.ws = new WebSocket('ws://localhost:5000/device');

    this.ws.onopen = () => {
      console.log('WebSocket connected, sending auth message');
      if (this.token) {
        this.sendMessage({
          type: 'auth',
          token: this.token
        });
      }
      toast.success('WebSocket bağlantısı kuruldu');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', {
          type: message.type,
          payload: message,
          timestamp: new Date().toISOString()
        });
        this.handleMessage(message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      toast.error('WebSocket bağlantısı kesildi, yeniden bağlanılıyor...');
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('WebSocket bağlantı hatası');
    };
  }

  private handleMessage(message: any) {
    console.log('1. WebSocket message received:', {
      type: message.type,
      payload: message,
      timestamp: new Date().toISOString()
    });

    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      console.log('2. Handlers found for message type:', message.type);
      handlers.forEach(handler => {
        try {
          console.log('3. Executing handler for:', message.type);
          handler(message);
          console.log('4. Handler executed successfully');
        } catch (error) {
          console.error('5. Handler error:', {
            type: message.type,
            error: error.message,
            stack: error.stack
          });
        }
      });
    } else {
      console.warn('6. Unhandled message type:', message);
    }
  }

  public addMessageHandler(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  public removeMessageHandler(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  public sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
      toast.error('WebSocket bağlantısı kurulamadı');
    }
  }

  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService.getInstance();