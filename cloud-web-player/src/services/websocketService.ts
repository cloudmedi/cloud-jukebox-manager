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
    console.log('Setting token:', token);
    this.token = token;
    this.connect();
  }

  private connect() {
    if (!this.token) {
      console.log('No token available, skipping connection');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.ws = new WebSocket('ws://localhost:5000/device');

    this.ws.onopen = () => {
      console.log('WebSocket connected, sending auth message');
      this.authenticate();
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
      console.log('WebSocket connection closed');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private authenticate() {
    if (this.ws && this.token) {
      console.log('Sending authentication message with token:', this.token);
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: this.token
      }));
    } else {
      console.error('Cannot authenticate: WebSocket or token not available');
    }
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

  private async handlePlaylistMessage(playlist: any) {
    try {
      console.log('Handling playlist:', playlist);
      
      // Download and store each song
      for (const song of playlist.songs) {
        await playlistDownloadService.downloadAndStoreSong(song, playlist.baseUrl);
      }

      // Store playlist metadata
      const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
      const existingIndex = playlists.findIndex((p: any) => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = playlist;
      } else {
        playlists.push(playlist);
      }
      
      localStorage.setItem('playlists', JSON.stringify(playlists));

      // Notify about successful playlist download
      this.sendPlaylistStatus(playlist._id, 'loaded');
      
      console.log('Playlist processed successfully');
    } catch (error) {
      console.error('Error handling playlist:', error);
      this.sendPlaylistStatus(playlist._id, 'error');
    }
  }

  private sendPlaylistStatus(playlistId: string, status: 'loading' | 'loaded' | 'error') {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'playlistStatus',
        playlistId,
        status
      }));
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
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
      console.error('WebSocket connection not available');
      this.connect();
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