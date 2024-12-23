const WebSocket = require('ws');
const Store = require('electron-store');
const { BrowserWindow } = require('electron');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.setupHandlers();
    this.connect();
    this.reconnectInterval = 5000; // 5 saniye
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
  }

  setupHandlers() {
    // Auth handler
    this.addMessageHandler('auth', (message) => {
      console.log('Auth message received:', message);
      if (message.status === 'success') {
        store.set('deviceInfo', { 
          token: message.deviceInfo.token || store.get('deviceInfo.token'),
          name: message.deviceInfo.name,
          volume: message.deviceInfo.volume 
        });
        console.log('Device info saved:', store.get('deviceInfo'));
      }
    });

    // Playlist handler
    this.addMessageHandler('playlist', async (message) => {
      console.log('Playlist message received:', message);
      try {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('playlist-received', message.data);
          console.log('Playlist update sent to renderer');
        }
      } catch (error) {
        console.error('Error handling playlist message:', error);
      }
    });

    // Command handler
    this.addMessageHandler('command', (message) => {
      console.log('Command message received:', message);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send(message.command, message.data);
      }
    });

    // Status handler
    this.addMessageHandler('status', (message) => {
      console.log('Status message received:', message);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('status-update', message);
      }
    });
  }

  connect() {
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    if (this.ws) {
      console.log('Closing existing connection');
      this.ws.close();
    }

    console.log('Connecting to WebSocket server...');
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.sendAuth(deviceInfo.token);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleReconnect();
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  sendAuth(token) {
    console.log('Sending auth message with token:', token);
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

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.log('No handler for message type:', message.type);
    }
  }

  addMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type) {
    this.messageHandlers.delete(type);
  }
}

module.exports = new WebSocketService();