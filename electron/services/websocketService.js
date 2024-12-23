const WebSocket = require('ws');
const Store = require('electron-store');
const WebSocketMessageHandler = require('./websocketMessageHandler');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.store = new Store();
    this.messageHandler = new WebSocketMessageHandler();
    this.connect();
  }

  connect() {
    const deviceInfo = this.store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    if (this.ws) {
      console.log('Closing existing connection');
      this.ws.close();
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
        this.messageHandler.handleMessage(message);
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

  sendAuth(token) {
    this.sendMessage({
      type: 'auth',
      token: token
    });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection not ready');
    }
  }
}

module.exports = new WebSocketService();