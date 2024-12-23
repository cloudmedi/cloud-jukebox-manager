const WebSocket = require('ws');
const WebSocketMessageHandler = require('./websocket/WebSocketMessageHandler');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandler = new WebSocketMessageHandler();
    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        this.messageHandler.handleMessage(message);
      } catch (error) {
        console.error('Message handling error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı');
    }
  }
}

const websocketService = new WebSocketService();
module.exports = websocketService;