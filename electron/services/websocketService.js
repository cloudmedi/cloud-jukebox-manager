const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();
const { createLogger } = require('../utils/logger');

const logger = createLogger('websocket-service');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.initialize();
  }

  initialize() {
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      logger.warn('No device info found, WebSocket initialization skipped');
      return;
    }

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:5000');
      
      this.ws.on('open', () => {
        logger.info('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendAuth();
        this.flushMessageQueue();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          logger.info('Received message:', message);
          this.handleMessage(message);
        } catch (error) {
          logger.error('Error parsing message:', error);
        }
      });

      this.ws.on('close', () => {
        logger.warn('WebSocket disconnected');
        this.isConnected = false;
        this.handleReconnect();
      });

      this.ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('Error creating WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  sendAuth() {
    const deviceInfo = store.get('deviceInfo');
    if (deviceInfo && deviceInfo.token) {
      this.send({
        type: 'auth',
        token: deviceInfo.token
      });
    }
  }

  send(message) {
    if (!this.isConnected || !this.ws) {
      logger.warn('WebSocket not connected, queueing message:', message);
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      logger.info('Sent message:', message);
    } catch (error) {
      logger.error('Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  handleMessage(message) {
    // Mesaj işleme mantığı buraya gelecek
    logger.info('Handling message:', message);
  }
}

// Singleton instance
const websocketService = new WebSocketService();
module.exports = websocketService;