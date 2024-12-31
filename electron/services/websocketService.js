const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.messageHandlers = new Map();
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
        
        // Mesaj tipine göre handler'ları çalıştır
        if (message.type && this.messageHandlers.has(message.type)) {
          const handlers = this.messageHandlers.get(message.type);
          handlers.forEach(handler => handler(message));
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

  // Yeni eklenen message handler fonksiyonu
  addMessageHandler(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType).add(handler);
    console.log(`Added message handler for type: ${messageType}`);
  }

  // Handler'ı kaldırmak için yeni fonksiyon
  removeMessageHandler(messageType, handler) {
    if (this.messageHandlers.has(messageType)) {
      this.messageHandlers.get(messageType).delete(handler);
      console.log(`Removed message handler for type: ${messageType}`);
    }
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