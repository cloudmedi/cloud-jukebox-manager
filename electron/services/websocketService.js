const WebSocket = require('ws');
const { BrowserWindow, app } = require('electron');
let store;

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.initStore();
  }

  async initStore() {
    try {
      const Store = (await import('electron-store')).default;
      store = new Store();
      console.log('Store initialized successfully');
    } catch (error) {
      console.error('Error initializing store:', error);
    }
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
      this.isConnecting = false;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
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
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      this.isConnecting = false;
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 5000);
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
    } else {
      console.log('Unhandled message type:', message.type);
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

  async sendMessage(message) {
    // Wait for store to be initialized if needed
    if (!store) {
      await this.initStore();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı, yeniden bağlanılıyor...');
      this.connect();
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.messageHandlers.clear();
    this.isConnecting = false;
  }
}

const websocketService = new WebSocketService();
module.exports = websocketService;