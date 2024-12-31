const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.connect();
  }

  connect() {
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    this.token = deviceInfo.token;
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.sendAuth(deviceInfo.token);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
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

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Token'ı ekle
      const messageWithToken = {
        ...message,
        token: this.token
      };
      console.log('Sending message:', messageWithToken);
      this.ws.send(JSON.stringify(messageWithToken));
    } else {
      console.error('WebSocket connection not ready');
    }
  }

  sendPlaybackStatus(status) {
    this.sendMessage({
      type: 'playbackStatus',
      status: status
    });
    console.log('Playback status sent:', status);
  }

  sendAuth(token) {
    this.sendMessage({
      type: 'auth',
      token: token
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = new WebSocketService();