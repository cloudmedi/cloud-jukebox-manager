const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class AnnouncementDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('announcement');
    this.store = new Store();
  }

  async preDelete(id, data) {
    this.logger.info(`Starting pre-delete phase for announcement ${id}`);
    
    // Çalan anons varsa durdur
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('stop-announcement');
    }
  }

  async executeDelete(id, data) {
    this.logger.info(`Executing delete for announcement ${id}`);
    
    try {
      // Store'dan anonsu bul ve sil
      const announcements = this.store.get('announcements', []);
      const announcement = announcements.find(a => a._id === id);
      
      if (announcement) {
        // Ses dosyasını sil
        if (announcement.audioFile) {
          const audioPath = path.join(app.getPath('userData'), 'announcements', announcement.audioFile);
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            this.logger.info(`Deleted audio file: ${audioPath}`);
          }
        }

        // Store'dan anonsu kaldır
        this.store.set('announcements', 
          announcements.filter(a => a._id !== id)
        );
      }

      // UI'ı güncelle
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('announcement-deleted', id);
      }

    } catch (error) {
      this.logger.error('Error during announcement deletion:', error);
      throw error;
    }
  }

  async postDelete(id, data) {
    this.logger.info(`Completing post-delete phase for announcement ${id}`);
    
    try {
      // Cache temizliği
      const announcementDir = path.join(app.getPath('userData'), 'announcements');
      if (fs.existsSync(announcementDir)) {
        const files = fs.readdirSync(announcementDir);
        for (const file of files) {
          if (file.startsWith(id)) {
            fs.unlinkSync(path.join(announcementDir, file));
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in post-delete cleanup:', error);
      // Temizlik hatası kritik değil, devam et
    }
  }
}

module.exports = AnnouncementDeleteHandler;