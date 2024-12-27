const WebSocket = require('ws');
const Store = require('electron-store');
const { app } = require('electron');
const playlistHandler = require('./playlist/PlaylistHandler');
const DeleteMessageHandler = require('./websocket/handlers/DeleteMessageHandler');
const CommandHandler = require('./handlers/CommandHandler');
const deviceService = require('./deviceService');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.deleteMessageHandler = new DeleteMessageHandler();
    this.setupHandlers();
    this.ensureDeviceInfoAndConnect();
  }

  async ensureDeviceInfoAndConnect() {
    try {
      // Token yoksa oluştur
      const token = deviceService.initializeDeviceToken();
      console.log('Ensured device token exists:', token);
      this.connect();
    } catch (error) {
      console.error('Error ensuring device info:', error);
      // 5 saniye sonra tekrar dene
      setTimeout(() => this.ensureDeviceInfoAndConnect(), 5000);
    }
  }

  setupHandlers() {
    this.addMessageHandler('auth', (message) => {
      console.log('Auth message received:', message);
      if (message.success) {
        store.set('deviceInfo', { token: message.token });
      }
    });

    this.addMessageHandler('playlist', async (message) => {
      console.log('Playlist message received:', message);
      try {
        const updatedPlaylist = await playlistHandler.handlePlaylist(message.data);
        const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('playlist-received', updatedPlaylist);
          console.log('Playlist update sent to renderer');
        }
      } catch (error) {
        console.error('Error handling playlist message:', error);
      }
    });

    this.addMessageHandler('command', (message) => {
      console.log('Command message received:', message);
      CommandHandler.handleCommand(message);
    });

    this.addMessageHandler('delete', async (message) => {
      console.log('Delete message received:', message);
      await this.deleteMessageHandler.handleMessage(message);
    });
  }

  connect() {
    // Her zaman token'ı taze al
    const token = deviceService.getStoredToken();
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    console.log('Connecting WebSocket with token:', token);
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected, sending auth...');
      this.sendAuth(token);
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('websocket-status', true);
      }
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
      console.log('WebSocket disconnected, reconnecting...');
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('websocket-status', false);
      }
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

module.exports = new WebSocketService();
