const WebSocket = require('ws');
const Store = require('electron-store');
const DownloadStateManager = require('./download/DownloadStateManager');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.isConnected = false;
    this.connect();
  }

  connect() {
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.sendAuth(deviceInfo.token);
      this.checkIncompleteDownloads(deviceInfo.token);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
        
        if (message.type === 'playlist') {
          const PlaylistHandler = require('./playlist/PlaylistHandler');
          PlaylistHandler.handlePlaylist(message.data);
        } else {
          this.handleMessage(message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket disconnected, reconnecting...');
      this.isConnected = false;
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
    });
  }

  async checkIncompleteDownloads(token) {
    try {
      const response = await fetch('http://localhost:5000/api/download-progress/latest', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return;
      
      const downloadState = await response.json();
      
      if (downloadState && downloadState.status === 'downloading') {
        console.log('Found incomplete download, resuming:', downloadState);
        
        // 5 dakikadan eski indirmeler için devam etme
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(downloadState.updatedAt) < fiveMinutesAgo) {
          console.log('Download state is too old, not resuming');
          return;
        }

        this.sendMessage({
          type: 'resumeDownload',
          playlistId: downloadState.playlistId,
          progress: downloadState.progress,
          completedChunks: downloadState.completedChunks
        });
      }
    } catch (error) {
      console.error('Error checking incomplete downloads:', error);
    }
  }

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  sendAuth(token) {
    this.sendMessage({
      type: 'auth',
      token: token
    });
  }

  addMessageHandler(type, handler) {
    console.log('Adding message handler for type:', type);
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);
  }

  removeMessageHandler(type, handler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  handleMessage(message) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Handler error for message type ${message.type}:`, error);
        }
      });
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();
module.exports = websocketService;