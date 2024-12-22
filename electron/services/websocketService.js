const WebSocket = require('ws');
const { ipcMain } = require('electron');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.isConnecting = false;
    this.token = null;
  }

  connect(token) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.token = token;

    console.log('WebSocket bağlantısı başlatılıyor...');
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket bağlantısı başarıyla kuruldu');
      this.isConnecting = false;
      
      // Token ile kimlik doğrulama
      this.sendAuthMessage();
    });

    this.ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Alınan mesaj:', message);
        
        if (message.type === 'playlist') {
          // Playlist mesajını audioService'e ilet
          const { ipcMain } = require('electron');
          ipcMain.emit('play-playlist', null, message.data);
        }
        
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      this.isConnecting = false;
      setTimeout(() => this.connect(this.token), this.reconnectInterval);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  sendAuthMessage() {
    const authMessage = {
      type: 'auth',
      token: this.token
    };
    this.sendMessage(authMessage);
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = new WebSocketService();