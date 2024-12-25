const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { createLogger } = require('../utils/logger');

const logger = createLogger('AnnouncementCleanup');

class AnnouncementCleanupService {
  constructor(wss) {
    this.wss = wss;
    this.cleanupInterval = null;
    this.pendingDeletions = new Map(); // deviceToken -> Set<announcementIds>
  }

  start() {
    // Her 5 dakikada bir kontrol et
    this.cleanupInterval = setInterval(() => {
      this.checkExpiredAnnouncements();
    }, 5 * 60 * 1000);
    
    logger.info('Announcement cleanup service started');
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info('Announcement cleanup service stopped');
  }

  async checkExpiredAnnouncements() {
    try {
      const now = new Date();
      const expiredAnnouncements = await Announcement.find({
        endDate: { $lt: now },
        status: 'active'
      }).populate('targetDevices');

      for (const announcement of expiredAnnouncements) {
        await this.handleExpiredAnnouncement(announcement);
      }
    } catch (error) {
      logger.error('Error checking expired announcements:', error);
    }
  }

  async handleExpiredAnnouncement(announcement) {
    try {
      // Status'ü güncelle
      announcement.status = 'completed';
      await announcement.save();

      // Her cihaza silme komutu gönder
      for (const device of announcement.targetDevices) {
        this.sendDeleteCommand(device.token, announcement._id);
        
        // Silme işlemini takip listesine ekle
        if (!this.pendingDeletions.has(device.token)) {
          this.pendingDeletions.set(device.token, new Set());
        }
        this.pendingDeletions.get(device.token).add(announcement._id.toString());
      }

      // Admin'e bildirim gönder
      await Notification.create({
        type: 'announcement',
        title: 'Kampanya Sona Erdi',
        message: `"${announcement.title}" kampanyası sona erdi ve cihazlardan siliniyor`,
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

      logger.info(`Announcement ${announcement._id} marked as expired`);
    } catch (error) {
      logger.error(`Error handling expired announcement ${announcement._id}:`, error);
    }
  }

  sendDeleteCommand(deviceToken, announcementId) {
    this.wss.sendToDevice(deviceToken, {
      type: 'command',
      command: 'deleteAnnouncement',
      announcementId: announcementId
    });
  }

  handleDeletionConfirmation(deviceToken, announcementId, success) {
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
  }
}

module.exports = AnnouncementCleanupService;