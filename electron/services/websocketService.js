const WebSocket = require('ws');
const Store = require('electron-store');
const { app } = require('electron');
const playlistHandler = require('./playlist/PlaylistHandler');
const DeleteAnnouncementHandler = require('./announcement/handlers/DeleteAnnouncementHandler');
const CommandHandler = require('./handlers/CommandHandler');
const store = new Store();

class WebSocketService {
  static #instance = null;

  static getInstance() {
    if (!WebSocketService.#instance) {
      WebSocketService.#instance = new WebSocketService();
    }
    return WebSocketService.#instance;
  }

  constructor() {
    if (WebSocketService.#instance) {
      throw new Error('WebSocketService singleton instance already exists. Use getInstance()');
    }
    
    this.ws = null;
    this.messageHandlers = new Map();
    this.deleteAnnouncementHandler = new DeleteAnnouncementHandler(this);
    this.setupHandlers();
    this.connect();

    console.log('WebSocketService instance created');
  }

  setupHandlers() {
    console.log('Setting up message handlers');
    
    this.addMessageHandler('auth', (message) => {
      console.log('Auth message received:', message);
      if (message.success) {
        store.set('deviceInfo', { token: message.token });
      }
    });

    this.addMessageHandler('playlist', async (message) => {
      console.log('Playlist message received:', message);
      try {
        const result = await playlistHandler.handlePlaylistMessage(message);
        if (result) {
          const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.webContents.send('playlist-received', result);
            console.log('Playlist update sent to renderer');
          }
        }
      } catch (error) {
        console.error('Error handling playlist message:', error);
      }
    });

    this.addMessageHandler('command', (message) => {
      console.log('Command message received:', message);
      CommandHandler.handleCommand(message);
    });
  }

  connect() {
    console.log('Attempting to connect WebSocket');
    
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.sendAuth(deviceInfo.token);
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
    console.log('Sending auth message with token:', token);
    this.sendMessage({
      type: 'auth',
      token: token
    });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection not ready');
    }
  }

  handleMessage(message) {
    console.log('Handling message:', message);
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.log('No handler for message type:', message.type);
    }
  }

  addMessageHandler(type, handler) {
    console.log('Adding message handler for type:', type);
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type) {
    console.log('Removing message handler for type:', type);
    this.messageHandlers.delete(type);
  }

  cleanup() {
    console.log('Cleaning up WebSocket service');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}

// Export singleton instance
module.exports = WebSocketService;