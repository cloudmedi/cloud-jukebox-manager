const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../../utils/logger');

const store = new Store();
const logger = createLogger('DeleteAnnouncementHandler');

class DeleteAnnouncementHandler {
  constructor(websocketService) {
    this.ws = websocketService;
  }

  async handleDeleteCommand(announcementId) {
    try {
      console.log(`Starting deletion process for announcement: ${announcementId}`);
      
      // Local storage'dan kampanyayı bul
      const announcements = store.get('announcements', []);
      const announcement = announcements.find(a => a._id === announcementId);

      if (!announcement) {
        console.warn(`Announcement ${announcementId} not found in local storage`);
        this.sendDeletionStatus(announcementId, false);
        return;
      }

      console.log(`Found announcement to delete:`, announcement);

      // Ses dosyasını sil
      if (announcement.localPath && fs.existsSync(announcement.localPath)) {
        try {
          fs.unlinkSync(announcement.localPath);
          console.log(`Deleted announcement audio file: ${announcement.localPath}`);
        } catch (error) {
          console.error(`Error deleting audio file: ${error.message}`);
          this.sendDeletionStatus(announcementId, false);
          return;
        }
      } else {
        console.log(`Audio file not found or already deleted: ${announcement.localPath}`);
      }

      // Local storage'dan kampanyayı kaldır
      store.set('announcements', announcements.filter(a => a._id !== announcementId));
      console.log(`Removed announcement ${announcementId} from local storage`);
      
      // Başarılı silme bildirimi gönder
      this.sendDeletionStatus(announcementId, true);
      
      logger.info(`Successfully deleted announcement ${announcementId}`);
      console.log(`Deletion process completed for announcement ${announcementId}`);
    } catch (error) {
      console.error(`Error in deletion process for ${announcementId}:`, error);
      logger.error(`Error deleting announcement ${announcementId}:`, error);
      this.sendDeletionStatus(announcementId, false);
    }
  }

  sendDeletionStatus(announcementId, success) {
    console.log(`Sending deletion status - Announcement: ${announcementId}, Success: ${success}`);
    this.ws.sendMessage({
      type: 'announcementDeleted',
      announcementId,
      success
    });
  }
}

module.exports = DeleteAnnouncementHandler;