const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { createLogger } = require('../../../utils/logger');
const DeleteMessage = require('../../../websocket/messages/DeleteMessage');
const AnnouncementPlayer = require('../../announcement/AnnouncementPlayer');

const store = new Store();
const logger = createLogger('DeleteAnnouncementHandler');

class AnnouncementDeleteHandler {
  constructor(websocketService) {
    this.ws = websocketService;
  }

  async handleDeleteCommand(announcementId) {
    try {
      logger.info(`Starting deletion process for announcement: ${announcementId}`);
      
      // 1. Önce çalan anonsu kontrol et ve durdur
      const currentAnnouncement = AnnouncementPlayer.getCurrentAnnouncement();
      if (currentAnnouncement && currentAnnouncement._id === announcementId) {
        logger.info('Stopping currently playing announcement');
        await AnnouncementPlayer.stopAnnouncement();
      }

      // 2. Local storage'dan anonsu bul
      const announcements = store.get('announcements', []);
      const announcement = announcements.find(a => a._id === announcementId);

      if (!announcement) {
        logger.warn(`Announcement ${announcementId} not found in local storage`);
        return;
      }

      // 3. Ses dosyasını sil
      if (announcement.audioFile) {
        try {
          const audioPath = path.join(app.getPath('userData'), 'announcements', announcement.audioFile);
          
          // Dosya erişilebilirlik kontrolü
          await fs.promises.access(audioPath, fs.constants.F_OK | fs.constants.W_OK);
          
          // Dosyayı sil
          await fs.promises.unlink(audioPath);
          logger.info(`Successfully deleted audio file: ${audioPath}`);
        } catch (error) {
          if (error.code === 'EBUSY') {
            // Dosya kullanımda ise biraz bekle ve tekrar dene
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
              const audioPath = path.join(app.getPath('userData'), 'announcements', announcement.audioFile);
              await fs.promises.unlink(audioPath);
              logger.info(`Successfully deleted audio file after retry: ${audioPath}`);
            } catch (retryError) {
              logger.error(`Failed to delete audio file after retry: ${retryError.message}`);
            }
          } else {
            logger.error(`Error deleting audio file: ${error.message}`);
          }
        }
      }

      // 4. Store'dan anonsu kaldır
      store.set('announcements', 
        announcements.filter(a => a._id !== announcementId)
      );
      
      logger.info(`Announcement removed from store: ${announcementId}`);

      // 5. UI'ı güncelle
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('announcement-deleted', announcementId);
      }

      // 6. Başarılı silme bildirimi gönder
      this.ws.sendMessage(
        DeleteMessage.createDeleteSuccess('announcement', announcementId)
      );

    } catch (error) {
      logger.error(`Error in deletion process: ${error.message}`);
      this.ws.sendMessage(
        DeleteMessage.createDeleteError('announcement', announcementId, error)
      );
    }
  }
}

module.exports = AnnouncementDeleteHandler;