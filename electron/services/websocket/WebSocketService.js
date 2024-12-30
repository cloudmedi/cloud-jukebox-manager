const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.on('open', () => {
      console.log('WebSocket connected');
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    });
  }

  sendScreenshot(token, screenshotData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending screenshot to admin panel...');
      this.ws.send(JSON.stringify({
        type: 'screenshot',
        token: token,
        data: screenshotData
      }));
      console.log('Screenshot sent successfully');
    } else {
      console.error('WebSocket connection not ready');
    }
  }

  addMessageHandler(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  removeMessageHandler(type, handler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı');
      this.connect();
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = new WebSocketService();
