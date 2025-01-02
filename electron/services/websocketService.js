const WebSocket = require('ws');
const Store = require('electron-store');
const { createLogger } = require('../utils/logger');
const RetryManager = require('./download/RetryManager');

const logger = createLogger('websocket-service');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.messageQueue = [];
    this.retryManager = new RetryManager();
    this.isConnecting = false;
    this.setupReconnection();
  }

  setupReconnection() {
    setInterval(() => {
      if (!this.ws && !this.isConnecting) {
        this.connect();
      }
    }, 5000);
  }

  connect() {
    if (this.isConnecting) return;

    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo?.token) {
      logger.warn('No device info found');
      return;
    }

    this.isConnecting = true;
    logger.info('Connecting to WebSocket server...');

    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      logger.info('WebSocket connected');
      this.isConnecting = false;
      this.sendAuth(deviceInfo.token);
      this.processMessageQueue();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        logger.debug('Received message:', message);
        this.handleMessage(message);
      } catch (error) {
        logger.error('Error parsing message:', error);
      }
    });

    this.ws.on('close', () => {
      logger.warn('WebSocket disconnected');
      this.ws = null;
      this.isConnecting = false;
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.ws = null;
      this.isConnecting = false;
    });
  }

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        logger.debug('Message sent:', message);
        return true;
      } catch (error) {
        logger.error('Error sending message:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      logger.warn('WebSocket not connected, queueing message');
      this.messageQueue.push(message);
      this.connect();
      return false;
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  addMessageHandler(type, handler) {
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
          logger.error(`Handler error for message type ${message.type}:`, error);
        }
      });
    } else {
      logger.warn('No handlers for message type:', message.type);
    }
  }

  sendAuth(token) {
    this.sendMessage({
      type: 'auth',
      token: token
    });
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.messageQueue = [];
    this.isConnecting = false;
  }
}

module.exports = new WebSocketService();