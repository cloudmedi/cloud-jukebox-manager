import { playlistDownloadService } from './playlistDownloadService';

class WebSocketService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor() {
    this.setupWebSocket();
  }

  setToken(token: string) {
    this.token = token;
    this.setupWebSocket();
  }

  private setupWebSocket() {
    if (!this.token) return;

    this.ws = new WebSocket('ws://localhost:5000/device');

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.authenticate();
    };

    this.ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleMessage(message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private authenticate() {
    if (this.ws && this.token) {
      this.ws.send(JSON.stringify({
        type: 'authenticate',
        token: this.token
      }));
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  private async handleMessage(message: any) {
    console.log('Received message:', message);

    switch (message.type) {
      case 'playlist':
        await this.handlePlaylistMessage(message.data);
        break;
      // Handle other message types...
    }
  }

  private async handlePlaylistMessage(playlist: any) {
    try {
      console.log('Handling playlist:', playlist);
      
      // Download and store each song
      for (const song of playlist.songs) {
        await playlistDownloadService.downloadAndStoreSong(song, playlist.baseUrl);
      }

      // Store playlist metadata in localStorage
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
      
      setTimeout(() => {
        this.setupWebSocket();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

export const websocketService = new WebSocketService();