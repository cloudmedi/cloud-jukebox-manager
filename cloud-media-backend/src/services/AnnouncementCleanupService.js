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
    this.cleanupInterval = setInterval(() => {
      this.checkExpiredAnnouncements();
    }, 5 * 60 * 1000);
    
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
        status: 'active'
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
      
      // Status'ü güncelle
      announcement.status = 'completed';
      await announcement.save();
      console.log(`Updated status to completed for announcement: ${announcement._id}`);

      // Her cihaza silme komutu gönder
      for (const device of announcement.targetDevices) {
        console.log(`Sending delete command to device: ${device.token}`);
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
      console.log(`Completed processing for announcement: ${announcement._id}`);
    } catch (error) {
      logger.error(`Error handling expired announcement ${announcement._id}:`, error);
      console.error('Error in handleExpiredAnnouncement:', error);
    }
  }

  sendDeleteCommand(deviceToken, announcementId) {
    console.log(`Attempting to send delete command - Device: ${deviceToken}, Announcement: ${announcementId}`);
    const sent = this.wss.sendToDevice(deviceToken, {
      type: 'command',
      command: 'deleteAnnouncement',
      announcementId: announcementId.toString()
    });
    console.log(`Delete command sent successfully: ${sent}`);
    return sent;
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