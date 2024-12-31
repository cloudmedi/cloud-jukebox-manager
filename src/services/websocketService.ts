import { handleDeleteMessage } from './websocket/handlers/DeleteMessageHandler';
import { handleDeviceStatusMessage } from './websocket/handlers/DeviceStatusHandler';
import { handleInitialStateMessage } from './websocket/handlers/InitialStateHandler';
import { handleDeviceDelete } from './websocket/handlers/DeviceDeleteHandler';
import { playlistDownloadService } from './playlistDownloadService';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>>;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  private constructor() {
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
    this.connect();
  }

  private setupMessageHandlers() {
    this.addMessageHandler('delete', handleDeleteMessage);
    this.addMessageHandler('delete', handleDeviceDelete);
    this.addMessageHandler('deviceStatus', handleDeviceStatusMessage);
    this.addMessageHandler('initialState', handleInitialStateMessage);
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('WebSocket bağlantısı kuruldu');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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
      console.warn('6. Unhandled message type:', {
        type: message.type,
        payload: message
      });
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
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı');
      this.connect();
    }
  }

  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
}

export default WebSocketService.getInstance();
