const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const store = new Store();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { cleanupCache } = require('../utils/cacheCleanup');

class DeviceDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('device');
  }

  async preDelete(id, data) {
    this.logger.info(`Starting pre-delete phase for device ${id}`);
    
    // Stop current playback
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('pause-playback');
    }
  }

  async executeDelete(id, data) {
    this.logger.info(`Executing delete for device ${id}`);
    
    try {
      // Get device info before cleanup
      const deviceData = store.get('deviceInfo');
      const token = deviceData?.token;
      const deviceInfo = deviceData?.deviceInfo;

      // Clear all store data
      store.clear();

      // Restore only token and device info
      if (token && deviceInfo) {
        store.set('deviceInfo', {
          token,
          deviceInfo
        });
      }

      // Clean up all audio files
      const userDataPath = app.getPath('userData');
      const foldersToClean = [
        'downloads',
        'playlists',
        'announcements',
        'audio'
      ];

      for (const folder of foldersToClean) {
        const folderPath = path.join(userDataPath, folder);
        if (fs.existsSync(folderPath)) {
          try {
            fs.rmSync(folderPath, { recursive: true, force: true });
            this.logger.info(`Cleaned up folder: ${folder}`);
          } catch (error) {
            this.logger.warn(`Failed to clean folder ${folder}: ${error.message}`);
          }
        }
      }

      // Reset all settings to default
      store.set('settings', {
        volume: 50,
        autoplay: false,
        notifications: true
      });

      // Notify UI
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('device-deleted', id);
        mainWindow.webContents.send('show-toast', {
          type: 'success',
          message: 'Cihaz başarıyla silindi ve veriler temizlendi'
        });
      }

    } catch (error) {
      this.logger.error('Error during device deletion:', error);
      throw error;
    }
  }

  async postDelete(id, data) {
    this.logger.info(`Completing post-delete phase for device ${id}`);
    
    try {
      // Cache temizliğini yap
      await cleanupCache();

      // Stop all audio playback
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('stop-playback');
        mainWindow.webContents.send('close-websocket');
      }

      // Uygulamayı kapat
      setTimeout(() => {
        app.quit();
      }, 1000);
    } catch (error) {
      this.logger.error('Error in post-delete cleanup:', error);
      // Hata olsa bile uygulamayı kapatmaya çalış
      app.quit();
    }
  }
}

module.exports = DeviceDeleteHandler;