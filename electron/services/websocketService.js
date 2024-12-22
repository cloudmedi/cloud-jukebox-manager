const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000; // 5 saniye
    this.isConnecting = false;
  }

  connect(token) {
    if (this.isConnecting) return;
    this.isConnecting = true;

    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket bağlantısı kuruldu');
      this.isConnecting = false;
      
      // Token ile kimlik doğrulama
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));

      // Uygulama açıldığında online durumunu bildir
      this.sendStatus({
        type: 'status',
        isOnline: true
      });
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      this.isConnecting = false;
      setTimeout(() => this.connect(token), this.reconnectInterval);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'auth':
        console.log('Authentication status:', message.status);
        break;
      
      case 'command':
        this.handleCommand(message);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleCommand(message) {
    switch (message.command) {
      case 'restart':
        // Electron uygulamasını yeniden başlat
        require('electron').app.relaunch();
        require('electron').app.exit(0);
        break;

      case 'setVolume':
        // Sistem ses seviyesini ayarla
        this.setSystemVolume(message.volume);
        break;

      default:
        console.log('Unknown command:', message.command);
    }
  }

  async setSystemVolume(volume) {
    try {
      // Platform'a göre ses ayarı
      const platform = process.platform;
      
      if (platform === 'win32') {
        // Windows için
        const { exec } = require('child_process');
        exec(`powershell -c "$volume = ${volume}/100; $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175);"`);
      } else if (platform === 'darwin') {
        // macOS için
        const { exec } = require('child_process');
        exec(`osascript -e "set volume output volume ${volume}"`);
      } else if (platform === 'linux') {
        // Linux için
        const { exec } = require('child_process');
        exec(`amixer -D pulse sset Master ${volume}%`);
      }

      // Ses seviyesi değişikliğini backend'e bildir
      this.sendStatus({
        type: 'volume',
        volume: volume
      });
    } catch (error) {
      console.error('Set volume error:', error);
    }
  }

  sendStatus(status) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(status));
    }
  }

  disconnect() {
    if (this.ws) {
      // Uygulama kapatılmadan önce offline durumunu bildir
      this.sendStatus({
        type: 'status',
        isOnline: false
      });
      
      // Bağlantıyı kapat
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = new WebSocketService();