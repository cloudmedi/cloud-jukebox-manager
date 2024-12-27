const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const store = new Store();

class DeviceDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('device');
  }

  async preDelete(id, data) {
    this.logger.info(`Starting pre-delete phase for device ${id}`);
    // Aktif çalma listesini durdur
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('stop-playback');
    }
  }

  async executeDelete(id, data) {
    this.logger.info(`Executing delete for device ${id}`);
    
    try {
      // Store'dan tüm cihaz verilerini temizle
      const deviceData = store.get('deviceInfo');
      if (deviceData) {
        // Sadece token bilgisini tut, diğer her şeyi temizle
        store.set('deviceInfo', {
          token: deviceData.token
        });
      }

      // Çalma listesi verilerini temizle
      store.delete('playlists');
      store.delete('currentPlaylist');
      store.delete('playbackState');
      store.delete('queue');
      store.delete('playbackHistory');
      store.delete('announcements');
      
      // Yerel ses dosyalarını temizle
      const fs = require('fs');
      const path = require('path');
      const audioDir = path.join(process.env.APPDATA || process.env.HOME, '.cloud-media', 'audio');
      
      if (fs.existsSync(audioDir)) {
        fs.readdirSync(audioDir).forEach(file => {
          const filePath = path.join(audioDir, file);
          try {
            fs.unlinkSync(filePath);
            this.logger.info(`Deleted audio file: ${filePath}`);
          } catch (err) {
            this.logger.error(`Error deleting file ${filePath}:`, err);
          }
        });
      }

      // UI'ya bildir
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('device-deleted', id);
        mainWindow.webContents.send('show-toast', {
          type: 'success',
          message: 'Cihaz başarıyla silindi ve tüm veriler temizlendi'
        });
      }

    } catch (error) {
      this.logger.error('Error during device deletion:', error);
      throw error;
    }
  }

  async postDelete(id, data) {
    this.logger.info(`Completing post-delete phase for device ${id}`);
    // Uygulama ayarlarını varsayılana döndür
    store.set('settings', {
      volume: 50,
      autoplay: false,
      notifications: true
    });
  }
}

module.exports = DeviceDeleteHandler;