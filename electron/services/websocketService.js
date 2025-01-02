const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
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
      this.sendAuth(deviceInfo.token);
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
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection not ready');
    }
  }

  sendAuth(token) {
    this.send({
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