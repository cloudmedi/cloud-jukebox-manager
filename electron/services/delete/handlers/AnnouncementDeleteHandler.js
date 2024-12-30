const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const AnnouncementPlayer = require('../../announcement/AnnouncementPlayer');

class AnnouncementDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('announcement');
    this.store = new Store();
  }

  async preDelete(id, data) {
    this.logger.info(`Starting pre-delete phase for announcement ${id}`);
    
    try {
      // Önce çalan anonsu durdur
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        // Çalan anons kontrolü
        const currentAnnouncement = AnnouncementPlayer.getCurrentAnnouncement();
        if (currentAnnouncement && currentAnnouncement._id === id) {
          this.logger.info('Stopping currently playing announcement before deletion');
          await AnnouncementPlayer.stopAnnouncement();
        }
      }
    } catch (error) {
      this.logger.error('Error in pre-delete phase:', error);
      throw error;
    }
  }

  async executeDelete(id, data) {
    this.logger.info(`Executing delete for announcement ${id}`);
    
    try {
      // Store'dan anonsu bul
      const announcements = this.store.get('announcements', []);
      const announcement = announcements.find(a => a._id === id);
      
      if (announcement) {
        // Ses dosyasını sil
        if (announcement.audioFile) {
          const audioPath = path.join(app.getPath('userData'), 'announcements', announcement.audioFile);
          
          // Dosya erişilebilirlik kontrolü
          try {
            await fs.promises.access(audioPath, fs.constants.F_OK | fs.constants.W_OK);
            
            // Dosyayı sil
            await fs.promises.unlink(audioPath);
            this.logger.info(`Successfully deleted audio file: ${audioPath}`);
          } catch (error) {
            if (error.code === 'EBUSY') {
              // Dosya kullanımda ise biraz bekle ve tekrar dene
              await new Promise(resolve => setTimeout(resolve, 1000));
              await fs.promises.unlink(audioPath);
              this.logger.info(`Successfully deleted audio file after retry: ${audioPath}`);
            } else {
              this.logger.error(`Error deleting audio file: ${error.message}`);
              throw error;
            }
          }
        }

        // Store'dan anonsu kaldır
        this.store.set('announcements', 
          announcements.filter(a => a._id !== id)
        );
        
        this.logger.info(`Announcement removed from store: ${id}`);
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
            const filePath = path.join(announcementDir, file);
            try {
              await fs.promises.unlink(filePath);
              this.logger.info(`Cleaned up related file: ${filePath}`);
            } catch (error) {
              this.logger.warn(`Failed to clean up file ${filePath}: ${error.message}`);
            }
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