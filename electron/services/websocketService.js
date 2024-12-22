const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.isConnecting = false;
  }

  connect(token) {
    if (this.isConnecting) return;
    this.isConnecting = true;

    console.log('WebSocket bağlantısı başlatılıyor...');
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket bağlantısı başarıyla kuruldu');
      this.isConnecting = false;
      
      // Token ile kimlik doğrulama
      const authMessage = {
        type: 'auth',
        token: token
      };
      console.log('Kimlik doğrulama mesajı gönderiliyor:', authMessage);
      this.ws.send(JSON.stringify(authMessage));

      // Bağlantı kurulduktan sonra bir süre bekleyip online durumunu bildir
      setTimeout(() => {
        const statusMessage = {
          type: 'status',
          isOnline: true
        };
        console.log('Online durum mesajı gönderiliyor:', statusMessage);
        this.sendStatus(statusMessage);
      }, 1000);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Sunucudan gelen mesaj:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      this.isConnecting = false;
      setTimeout(() => this.connect(token), this.reconnectInterval);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket hatası:', error);
      this.isConnecting = false;
    });
  }

  handleMessage(message) {
    console.log('Mesaj işleniyor:', message);
    
    switch (message.type) {
      case 'auth':
        console.log('Kimlik doğrulama durumu:', message.status);
        break;
      
      case 'command':
        console.log('Komut alındı:', message);
        this.handleCommand(message);
        break;

      default:
        console.log('Bilinmeyen mesaj tipi:', message.type);
    }
  }

  handleCommand(message) {
    console.log('Komut işleniyor:', message);
    
    switch (message.command) {
      case 'restart':
        console.log('Yeniden başlatma komutu alındı');
        require('electron').app.relaunch();
        require('electron').app.exit(0);
        break;

      case 'setVolume':
        console.log('Ses seviyesi değiştirme komutu alındı:', message.volume);
        this.setSystemVolume(message.volume);
        break;

      default:
        console.log('Bilinmeyen komut:', message.command);
    }
  }

  async setSystemVolume(volume) {
    try {
      console.log('Sistem ses seviyesi ayarlanıyor:', volume);
      const platform = process.platform;
      
      if (platform === 'win32') {
        console.log('Windows için ses ayarı yapılıyor');
        const { exec } = require('child_process');
        exec(`powershell -c "$volume = ${volume}/100; $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175);"`);
      } else if (platform === 'darwin') {
        console.log('MacOS için ses ayarı yapılıyor');
        const { exec } = require('child_process');
        exec(`osascript -e "set volume output volume ${volume}"`);
      } else if (platform === 'linux') {
        console.log('Linux için ses ayarı yapılıyor');
        const { exec } = require('child_process');
        exec(`amixer -D pulse sset Master ${volume}%`);
      }

      const statusMessage = {
        type: 'volume',
        volume: volume
      };
      console.log('Ses seviyesi değişikliği bildiriliyor:', statusMessage);
      this.sendStatus(statusMessage);
    } catch (error) {
      console.error('Ses seviyesi ayarlama hatası:', error);
    }
  }

  sendStatus(status) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Durum mesajı gönderiliyor:', status);
      this.ws.send(JSON.stringify(status));
    } else {
      console.log('WebSocket bağlantısı kapalı, durum mesajı gönderilemedi');
    }
  }

  disconnect() {
    if (this.ws) {
      console.log('Uygulama kapatılıyor, offline durumu gönderiliyor');
      
      const offlineMessage = {
        type: 'status',
        isOnline: false
      };
      console.log('Offline durum mesajı gönderiliyor:', offlineMessage);
      this.sendStatus(offlineMessage);
      
      setTimeout(() => {
        this.ws.close();
        this.ws = null;
        console.log('WebSocket bağlantısı kapatıldı');
      }, 500);
    }
  }
}

module.exports = new WebSocketService();