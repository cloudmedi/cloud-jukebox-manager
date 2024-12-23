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
  }

  setupHandlers() {
    // Auth handler
    this.addMessageHandler('auth', (message) => {
      console.log('Auth message received:', message);
      if (message.success) {
        store.set('deviceInfo', { token: message.token });
      }
    });

    // Playlist handler
    this.addMessageHandler('playlist', (message) => {
      console.log('Playlist message received:', message);
      try {
        // Playlist'i store'a kaydet
        const playlists = store.get('playlists', []);
        const existingIndex = playlists.findIndex(p => p._id === message.data._id);
        
        if (existingIndex !== -1) {
          playlists[existingIndex] = message.data;
        } else {
          playlists.push(message.data);
        }
        
        store.set('playlists', playlists);
        console.log('Playlist saved to store:', message.data.name);

        // Renderer process'e playlist güncellemesini gönder
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
  }

  connect() {
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected');
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
      console.log('WebSocket disconnected, reconnecting...');
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