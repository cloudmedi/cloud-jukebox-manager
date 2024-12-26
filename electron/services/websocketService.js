const WebSocket = require('ws');
const Store = require('electron-store');
const { app } = require('electron');
const playlistHandler = require('./playlist/PlaylistHandler');
const DeleteMessageHandler = require('./websocket/handlers/DeleteMessageHandler');
const CommandHandler = require('./handlers/CommandHandler');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.setupHandlers();
    this.connect();
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
      await DeleteMessageHandler.handleMessage(message);
    });
  }

  sendAuth(token) {
    console.log('Sending auth message with token:', token);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    } else {
      console.error('WebSocket not ready for auth message');
    }
  }

  connect() {
    const deviceInfo = store.get('deviceInfo');
    if (!deviceInfo || !deviceInfo.token) {
      console.log('No device info found');
      return;
    }

    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
      this.sendAuth(deviceInfo.token);
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('websocket-status', true);
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
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    setTimeout(() => this.connect(), 5000);
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

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Device token'ını mesaja ekle
      const deviceInfo = store.get('deviceInfo');
      const messageWithToken = {
        ...message,
        deviceToken: deviceInfo?.token
      };
      
      console.log('Sending message with token:', messageWithToken);
      this.ws.send(JSON.stringify(messageWithToken));
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
    this.messageHandlers.clear();
  }
}

module.exports = new WebSocketService();