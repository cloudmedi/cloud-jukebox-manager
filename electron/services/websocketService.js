const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();
const PlaylistHandler = require('./playlist/PlaylistHandler');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.playlistHandler = new PlaylistHandler();
    this.setupHandlers();
  }

  setupHandlers() {
    // Auth handler
    this.addMessageHandler('auth', (message) => {
      console.log('Auth message received:', message);
      if (message.status === 'success') {
        console.log('Authentication successful, saving device info:', message.deviceInfo);
        store.set('deviceInfo', message.deviceInfo);
      } else {
        console.error('Authentication failed:', message);
      }
    });

    // Playlist handler
    this.addMessageHandler('playlist', async (message) => {
      console.log('Playlist message received:', message);
      try {
        await this.playlistHandler.handlePlaylist(message.data);
      } catch (error) {
        console.error('Error handling playlist message:', error);
      }
    });

    // Command handler
    this.addMessageHandler('command', (message) => {
      console.log('Command message received:', message);
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send(message.command, message.data);
      }
    });
  }

  connect(token) {
    if (!token) {
      console.error('Cannot connect: No token provided');
      return;
    }

    console.log('Attempting WebSocket connection with token:', token);
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected successfully, sending auth message');
      this.sendAuth(token);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received WebSocket message:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket disconnected, reconnecting in 5 seconds...');
      setTimeout(() => this.connect(token), 5000);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.ws) {
      console.log('Disconnecting WebSocket');
      this.ws.close();
      this.ws = null;
    }
  }

  sendAuth(token) {
    console.log('Sending auth message with token:', token);
    this.sendMessage({
      type: 'auth',
      token: token
    });
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

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection not ready');
    }
  }
}

module.exports = new WebSocketService();