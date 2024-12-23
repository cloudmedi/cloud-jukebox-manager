const WebSocket = require('ws');
const Store = require('electron-store');
const { BrowserWindow, app } = require('electron');
const playlistHandler = require('./playlist/PlaylistHandler');
const deviceService = require('./deviceService');
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

    // Command handler
    this.addMessageHandler('command', async (message) => {
      console.log('Command message received:', message);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      
      switch (message.command) {
        case 'shutdown':
          if (message.reason === 'device_deleted') {
            // Kullanıcıya bildirim göster
            if (mainWindow) {
              mainWindow.webContents.send('show-notification', {
                title: 'Cihaz Silindi',
                body: 'Bu cihaz sistemden silindi. Uygulama kapatılıyor.'
              });
            }

            // Yerel dosyaları temizle
            await deviceService.cleanupLocalFiles();

            // 3 saniye sonra uygulamayı kapat
            setTimeout(() => {
              app.quit();
            }, 3000);
          }
          break;

        case 'restart':
          console.log('Restarting application...');
          app.relaunch();
          app.exit(0);
          break;
          
        default:
          if (mainWindow) {
            mainWindow.webContents.send(message.command, message.data);
          }
          break;
      }
    });

    // Playlist handler
    this.addMessageHandler('playlist', async (message) => {
      console.log('Playlist message received:', message);
      try {
        const updatedPlaylist = await playlistHandler.handlePlaylist(message.data);
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('playlist-received', updatedPlaylist);
        }
      } catch (error) {
        console.error('Error handling playlist message:', error);
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
      const mainWindow = BrowserWindow.getAllWindows()[0];
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
      const mainWindow = BrowserWindow.getAllWindows()[0];
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
    const deviceInfo = deviceService.getDeviceInfo();
    this.sendMessage({
      type: 'auth',
      token: token,
      deviceInfo: deviceInfo
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