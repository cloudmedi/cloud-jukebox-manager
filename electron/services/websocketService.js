const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
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
}

// Singleton instance
const websocketService = new WebSocketService();
module.exports = websocketService;