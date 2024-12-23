const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.isConnecting = false;
    this.token = null;
    this.messageQueue = [];
    this.maxRetries = 5;
    this.retryCount = 0;
  }

  connect(token) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.token = token;

    console.log('WebSocket bağlantısı başlatılıyor...');
    
    try {
      this.ws = new WebSocket('ws://localhost:5000');

      this.ws.on('open', () => {
        console.log('WebSocket bağlantısı başarıyla kuruldu');
        this.isConnecting = false;
        this.retryCount = 0;
        
        // Token ile kimlik doğrulama
        this.sendAuthMessage();
        
        // Kuyruktaki mesajları gönder
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.sendMessage(message);
        }
      });

      this.ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          console.log('Alınan mesaj:', message);
          
          if (message.type === 'playlist') {
            const { ipcMain } = require('electron');
            ipcMain.emit('play-playlist', null, message.data);
          }
          
        } catch (error) {
          console.error('Message parsing error:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('WebSocket bağlantısı kapandı');
        this.isConnecting = false;
        
        if (this.retryCount < this.maxRetries) {
          console.log(`Yeniden bağlanılıyor... (Deneme ${this.retryCount + 1}/${this.maxRetries})`);
          this.retryCount++;
          setTimeout(() => this.connect(this.token), this.reconnectInterval);
        } else {
          console.error('Maksimum yeniden bağlanma denemesi aşıldı');
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
          this.isConnecting = false;
        }
      });
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      this.isConnecting = false;
    }
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
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      console.log('WebSocket bağlı değil, mesaj kuyruğa ekleniyor');
      this.messageQueue.push(message);
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.messageQueue = [];
      this.retryCount = 0;
    }
  }
}

module.exports = new WebSocketService();