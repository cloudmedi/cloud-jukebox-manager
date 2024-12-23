const WebSocket = require('ws');
const { BrowserWindow } = require('electron');

class WebSocketService {
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    WebSocketService.instance = this;
    
    this.ws = null;
    this.messageHandlers = new Map();
    this.connect();
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    // Auth mesaj handler'ı
    this.addMessageHandler('auth', (message) => {
      console.log('Auth başarılı:', message);
      if (message.status === 'success') {
        // Device bilgilerini güncelle
        const { name, volume } = message.deviceInfo;
        // Volume değişikliğini ilet
        if (this.ws && volume !== undefined) {
          this.sendMessage({
            type: 'command',
            command: 'setVolume',
            volume: volume
          });
        }
      }
    });

    // Playlist mesaj handler'ı
    this.addMessageHandler('playlist', (message) => {
      console.log('Playlist alındı:', message);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      
      if (mainWindow) {
        // Playlist'i renderer process'e gönder
        mainWindow.webContents.send('playlist-received', message.data);
        
        // Playlist durumunu güncelle
        this.sendMessage({
          type: 'playlistStatus',
          status: 'loading',
          playlistId: message.data._id
        });
      }
    });
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
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
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
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
      console.error('WebSocket bağlantısı kurulamadı');
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();
module.exports = websocketService;