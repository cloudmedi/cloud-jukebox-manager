import { handleDeviceStatusMessage } from './websocket/handlers/DeviceStatusHandler';
import { handleInitialStateMessage } from './websocket/handlers/InitialStateHandler';
import { handleDeviceDelete } from './websocket/handlers/DeviceDeleteHandler';
import { MessageHandler } from './websocket/WebSocketConfig';
import { playlistDownloadService } from './playlistDownloadService';
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
    this.addMessageHandler('playlist', this.handlePlaylistMessage.bind(this));
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

  private async handlePlaylistMessage(message: any) {
    console.log('Handling playlist message:', message);
    
    if (!message.data) {
      console.error('Invalid playlist message:', message);
      toast.error('Geçersiz playlist mesajı');
      return;
    }

    const playlist = message.data;
    
    try {
      // Playlist indirme başladı bildirimi
      toast.info(`"${playlist.name}" playlist'i indiriliyor...`);
      
      // Playlist durumunu güncelle
      this.sendMessage({
        type: 'playlistStatus',
        status: 'loading',
        playlistId: playlist._id
      });

      // Playlist'teki tüm şarkıları indir
      for (const song of playlist.songs) {
        await playlistDownloadService.downloadAndStoreSong(song, playlist.baseUrl);
      }

      // Başarılı indirme bildirimi
      toast.success(`"${playlist.name}" playlist'i başarıyla indirildi`);
      
      // Playlist durumunu güncelle
      this.sendMessage({
        type: 'playlistStatus',
        status: 'loaded',
        playlistId: playlist._id
      });

    } catch (error) {
      console.error('Error handling playlist:', error);
      toast.error(`Playlist indirme hatası: ${error.message}`);
      
      // Hata durumunu bildir
      this.sendMessage({
        type: 'playlistStatus',
        status: 'error',
        playlistId: playlist._id,
        error: error.message
      });
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

  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService.getInstance();