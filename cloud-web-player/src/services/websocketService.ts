import { handleDeleteMessage } from './websocket/handlers/DeleteMessageHandler';
import { handleDeviceStatusMessage } from './websocket/handlers/DeviceStatusHandler';
import { handleInitialStateMessage } from './websocket/handlers/InitialStateHandler';
import { handleDeviceDelete } from './websocket/handlers/DeviceDeleteHandler';
import { toast } from 'sonner';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>>;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    this.addMessageHandler('delete', handleDeleteMessage);
    this.addMessageHandler('delete', handleDeviceDelete);
    this.addMessageHandler('deviceStatus', handleDeviceStatusMessage);
    this.addMessageHandler('initialState', handleInitialStateMessage);
    this.addMessageHandler('auth', this.handleAuthMessage.bind(this));
  }

  private handleAuthMessage(message: any) {
    console.log('Auth message received:', message);
    if (message.status === 'success') {
      toast.success('Bağlantı başarılı');
      this.reconnectAttempts = 0;
    } else {
      toast.error('Bağlantı başarısız: ' + message.message);
    }
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public setToken(token: string) {
    console.log('Setting token:', token);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendAuthMessage(token);
    } else {
      this.connect(token);
    }
  }

  private connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket...');
    this.ws = new WebSocket('ws://localhost:5000/device');

    this.ws.onopen = () => {
      console.log('WebSocket connected, sending auth message');
      this.sendAuthMessage(token);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(token), 5000);
      } else {
        toast.error('Bağlantı kurulamadı. Lütfen sayfayı yenileyin.');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Bağlantı hatası oluştu');
    };
  }

  private sendAuthMessage(token: string) {
    this.sendMessage({
      type: 'auth',
      token: token
    });
  }

  private handleMessage(message: any) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Handler error:', error);
        }
      });
    } else {
      console.warn('Unhandled message type:', message.type);
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