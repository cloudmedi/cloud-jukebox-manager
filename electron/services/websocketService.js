const WebSocket = require('ws');
const Store = require('electron-store');
const { app } = require('electron');
const playlistHandler = require('./playlist/PlaylistHandler');
const DeleteMessageHandler = require('./websocket/handlers/DeleteMessageHandler');
const CommandHandler = require('./handlers/CommandHandler');
const scheduleHandler = require('./schedule/ScheduleHandler');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.deleteMessageHandler = new DeleteMessageHandler();
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
        console.error('Error handling playlist:', error);
      }
    });

    this.addMessageHandler('command', (message) => {
      console.log('Command message received:', message);
      // Mesaj yapısını düzelt
      const commandMessage = message.data && message.data.type === 'command' 
        ? message.data  // İç içe command mesajı
        : message;      // Normal command mesajı
      
      CommandHandler.handleCommand(commandMessage);
    });

    this.addMessageHandler('downloadProgress', (message) => {
      console.log('Download progress message received:', message);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const deviceToken = store.get('deviceInfo')?.token;
        
        // İndirme tamamlandıysa status'ü completed yap
        const status = message.data.progress >= 100 ? 'completed' : 'downloading';
        
        const messageWithToken = {
          type: 'downloadProgress',
          data: {
            ...message.data,
            status: status,
            progress: message.data.progress,
            downloadedBytes: message.data.downloadedBytes,
            totalBytes: message.data.totalBytes
          },
          deviceToken
        };
        
        console.log('Sending download progress:', messageWithToken);
        this.ws.send(JSON.stringify(messageWithToken));
      }
    });

    this.addMessageHandler('delete', async (message) => {
      console.log('Delete message received:', message);
      await this.deleteMessageHandler.handleMessage(message);
    });

    // Schedule handlers
    this.addMessageHandler('schedule-created', async (message) => {
      console.log('Schedule created message received:', message);
      await scheduleHandler.handleNewSchedule(message.data);
    });

    this.addMessageHandler('schedule-updated', async (message) => {
      console.log('Schedule updated message received:', message);
      await scheduleHandler.handleScheduleUpdate(message.data);
    });

    this.addMessageHandler('schedule-deleted', async (message) => {
      console.log('Schedule deleted message received:', message);
      await scheduleHandler.handleScheduleDelete(message.data);
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
    try {
      // Mesaj string ise parse et, değilse direkt kullan
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      console.log('WebSocket message received:', JSON.stringify(data, null, 2));
      
      const handlers = this.messageHandlers.get(data.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Handler error for message type ${data.type}:`, error);
          }
        });
      } else {
        console.log('Unhandled message type:', data.type, 'Available handlers:', Array.from(this.messageHandlers.keys()));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
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
