const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const DeleteService = require('./DeleteService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('AnnouncementCleanup');

class AnnouncementCleanupService {
  constructor(wss) {
    this.wss = wss;
    this.cleanupInterval = null;
    this.pendingDeletions = new Map(); // deviceToken -> Set<announcementIds>
  }

  start() {
    this.cleanupInterval = setInterval(() => {
      this.checkExpiredAnnouncements();
    }, 5 * 60 * 1000); // Her 5 dakikada bir kontrol et
    
    logger.info('Announcement cleanup service started');
    console.log('Cleanup service started');
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info('Announcement cleanup service stopped');
    console.log('Cleanup service stopped');
  }

  async checkExpiredAnnouncements() {
    try {
      const now = new Date();
      console.log('Checking expired announcements at:', now);
      
      const expiredAnnouncements = await Announcement.find({
        endDate: { $lt: now },
        status: { $ne: 'completed' } // Sadece tamamlanmamış olanları al
      }).populate('targetDevices');

      console.log('Found expired announcements:', expiredAnnouncements.length);

      for (const announcement of expiredAnnouncements) {
        await this.handleExpiredAnnouncement(announcement);
      }
    } catch (error) {
      logger.error('Error checking expired announcements:', error);
      console.error('Error in checkExpiredAnnouncements:', error);
    }
  }

  async handleExpiredAnnouncement(announcement) {
    try {
      console.log(`Processing expired announcement: ${announcement._id}`);

      // DeleteService'i kullanarak anonsu sil
      await DeleteService.deleteEntity('announcement', announcement._id.toString(), {
        wss: this.wss,
        notifyDevices: true,
        cleanupFiles: true
      });

      // Admin'e bildirim gönder
      await Notification.create({
        type: 'announcement',
        title: 'Kampanya Sona Erdi',
        message: `"${announcement.title}" kampanyası süresi dolduğu için otomatik olarak silindi`,
        read: false
      });

      // Admin'lere WebSocket bildirimi gönder
      this.wss.broadcastToAdmins({
        type: 'announcementExpired',
        announcement: {
          id: announcement._id,
          title: announcement.title,
          expiredAt: new Date()
        }
      });

      // Cihazlara silme komutu gönder
      if (announcement.targetDevices && announcement.targetDevices.length > 0) {
        announcement.targetDevices.forEach(device => {
          if (device.token) {
            this.wss.sendToDevice(device.token, {
              type: 'command',
              command: 'deleteAnnouncement',
              announcementId: announcement._id.toString()
            });
          }
        });
      }

      logger.info(`Announcement ${announcement._id} deleted due to expiration`);
      console.log(`Completed processing for announcement: ${announcement._id}`);
    } catch (error) {
      logger.error(`Error handling expired announcement ${announcement._id}:`, error);
      console.error('Error in handleExpiredAnnouncement:', error);
    }
  }

  handleDeletionConfirmation(deviceToken, announcementId, success) {
    console.log(`Received deletion confirmation - Device: ${deviceToken}, Announcement: ${announcementId}, Success: ${success}`);
    
    // Silme işlemini takip listesinden kaldır
    const deviceDeletions = this.pendingDeletions.get(deviceToken);
    if (deviceDeletions) {
      deviceDeletions.delete(announcementId);
      if (deviceDeletions.size === 0) {
        this.pendingDeletions.delete(deviceToken);
      }
    }

    // Admin'e bildirim gönder
    this.wss.broadcastToAdmins({
      type: 'announcementDeleteStatus',
      deviceToken,
      announcementId,
      success
    });

    logger.info(`Announcement ${announcementId} deletion ${success ? 'succeeded' : 'failed'} on device ${deviceToken}`);
    console.log(`Deletion confirmation processed - Device: ${deviceToken}, Success: ${success}`);
  }
}

module.exports = AnnouncementCleanupService;