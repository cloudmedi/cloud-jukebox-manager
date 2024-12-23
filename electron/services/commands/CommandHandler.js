const { ipcRenderer } = require('electron');
const deviceService = require('../deviceService');

class CommandHandler {
  constructor() {
    this.setupCommandListeners();
  }

  setupCommandListeners() {
    ipcRenderer.on('websocket-message', async (event, message) => {
      console.log('WebSocket message received:', message);

      if (message.type === 'command') {
        await this.handleCommand(message);
      }
    });
  }

  async handleCommand(message) {
    console.log('Handling command:', message);

    switch (message.command) {
      case 'shutdown':
        await this.handleShutdown(message.reason);
        break;
      // Diğer komutlar buraya eklenebilir
      default:
        console.log('Unknown command:', message.command);
    }
  }

  async handleShutdown(reason) {
    if (reason === 'device_deleted') {
      // Kullanıcıya bilgi ver
      new Notification('Cihaz Silindi', {
        body: 'Bu cihaz sistemden silindi. Uygulama kapatılıyor.'
      });

      try {
        // Önce ses çalmayı durdur
        const audio = document.getElementById('audioPlayer');
        if (audio) {
          audio.pause();
          audio.src = '';
        }

        // Yerel dosyaları temizle
        await deviceService.cleanupLocalFiles();

        // 3 saniye sonra uygulamayı kapat
        setTimeout(() => {
          ipcRenderer.send('quit-app');
        }, 3000);
      } catch (error) {
        console.error('Shutdown error:', error);
      }
    }
  }
}

module.exports = new CommandHandler();