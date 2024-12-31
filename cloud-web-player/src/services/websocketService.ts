import { handleDeleteMessage } from './websocket/handlers/DeleteMessageHandler';
import { handleDeviceStatusMessage } from './websocket/handlers/DeviceStatusHandler';
import { handleInitialStateMessage } from './websocket/handlers/InitialStateHandler';
import { handleDeviceDelete } from './websocket/handlers/DeviceDeleteHandler';
import { WebSocketConnection } from './websocket/WebSocketConnection';
import { MessageHandler } from './websocket/WebSocketConfig';

class WebSocketService {
  private static instance: WebSocketService;
  private messageHandlers: Map<string, Set<MessageHandler>>;
  private connection: WebSocketConnection;

  private constructor() {
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
    this.connection = new WebSocketConnection(
      this.handleMessage.bind(this),
      this.handleConnectionChange.bind(this)
    );
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

  public setToken(token: string) {
    this.connection.setToken(token);
  }

  private handleMessage(message: any) {
    console.log('WebSocket message received:', {
      type: message.type,
      payload: message,
      timestamp: new Date().toISOString()
    });

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

  private handleConnectionChange(isConnected: boolean) {
    console.log('WebSocket connection status:', isConnected);
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
    this.connection.sendMessage(message);
  }

  public cleanup() {
    this.connection.cleanup();
  }
}

export const websocketService = WebSocketService.getInstance();