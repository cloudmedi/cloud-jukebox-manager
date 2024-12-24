const WebSocket = require('ws');
const Store = require('electron-store');
const { BrowserWindow, app } = require('electron');
const playlistHandler = require('./playlist/PlaylistHandler');
const announcementHandler = require('./announcement/AnnouncementHandler');
const announcementPlayer = require('./announcement/AnnouncementPlayer');
const store = new Store();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.connect();

    // Anons handler'ını ekle
    this.addMessageHandler('command', async (message) => {
      console.log('Command message received:', message);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      
      switch (message.command) {
        case 'playAnnouncement':
          try {
            const announcement = await announcementHandler.handleAnnouncement(message.announcement);
            announcementPlayer.playAnnouncement(announcement);
          } catch (error) {
            console.error('Anons oynatma hatası:', error);
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
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
      this.isConnecting = false;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
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
      this.isConnecting = false;
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 5000);
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

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.messageHandlers.clear();
    this.isConnecting = false;
  }
}

module.exports = new WebSocketService();