import { handleDeleteMessage } from './websocket/handlers/DeleteMessageHandler';
import { handleDeviceStatusMessage } from './websocket/handlers/DeviceStatusHandler';
import { handleInitialStateMessage } from './websocket/handlers/InitialStateHandler';
import { handleDeviceDelete } from './websocket/handlers/DeviceDeleteHandler';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>>;
  private eventListeners: Map<string, Set<(data: any) => void>>;

  private constructor() {
    this.messageHandlers = new Map();
    this.eventListeners = new Map();
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
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket('ws://localhost:5000/admin');

    this.socket.onopen = () => {
      console.log('WebSocket bağlantısı kuruldu');
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'deviceDownloadProgress') {
          // Gelen mesajı düzenle ve emit et
          const formattedMessage = {
            deviceToken: message.deviceToken,
            status: message.status,
            playlistId: message.playlistId,
            totalSongs: message.totalSongs,
            completedSongs: message.completedSongs,
            songProgress: message.songProgress,
            progress: message.progress
          };
          
          this.emit('deviceDownloadProgress', formattedMessage);
        } else {
          this.handleMessage(message);
        }
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      setTimeout(() => this.connect(), 5000);
    };

    this.socket.onerror = (error) => {
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

  public on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  public off(event: string, callback: (data: any) => void) {
    this.eventListeners.get(event)?.delete(callback);
  }

  public emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  public sendMessage(message: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı');
      this.connect();
    }
  }

  public cleanup() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.eventListeners.clear();
  }
}

export default WebSocketService.getInstance();
