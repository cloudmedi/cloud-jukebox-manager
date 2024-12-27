const BaseDeleteHandler = require('./BaseDeleteHandler');
const Announcement = require('../../../models/Announcement');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('AnnouncementDeleteHandler');

class AnnouncementDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('announcement');
  }

  async preDelete(id, options) {
    logger.info(`Starting pre-delete phase for announcement ${id}`);
    
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new Error('Anons bulunamadı');
    }

    // Silme başladı bildirimi
    if (options.wss) {
      options.wss.broadcastToAdmins({
        type: 'delete',
        action: 'started',
        entityType: 'announcement',
        entityId: id,
        data: {
          announcementName: announcement.title
        }
      });
    }

    return announcement;
  }

  async executeDelete(id, options, announcement) {
    logger.info(`Executing delete for announcement ${id}`);

    try {
      // Ses dosyasını sil
      if (announcement.audioFile) {
        const audioPath = path.join('uploads', 'announcements', announcement.audioFile);
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          logger.info(`Deleted audio file: ${audioPath}`);
        }
      }

      // Cihazlara bildirim gönder
      if (options.notifyDevices && announcement.targetDevices) {
        announcement.targetDevices.forEach(deviceId => {
          if (options.wss) {
            options.wss.sendToDevice(deviceId, {
              type: 'command',
              command: 'deleteAnnouncement',
              announcementId: id
            });
          }
        });
      }

      // Veritabanından sil
      await Announcement.findByIdAndDelete(id);
      logger.info(`Announcement deleted from database: ${id}`);

      // Başarılı silme bildirimi
      if (options.wss) {
        options.wss.broadcastToAdmins({
          type: 'delete',
          action: 'success',
          entityType: 'announcement',
          entityId: id,
          data: {
            announcementName: announcement.title
          }
        });
      }
    } catch (error) {
      logger.error(`Error during announcement deletion: ${error.message}`);
      throw error;
    }
  }

  async postDelete(id, options) {
    logger.info(`Completing post-delete phase for announcement ${id}`);
    
    try {
      // Cache temizliği
      if (options.cleanupFiles) {
        const announcementDir = path.join('uploads', 'announcements');
        if (fs.existsSync(announcementDir)) {
          const files = fs.readdirSync(announcementDir);
          for (const file of files) {
            if (file.startsWith(id)) {
              fs.unlinkSync(path.join(announcementDir, file));
              logger.info(`Cleaned up cached file: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error in post-delete cleanup:', error);
      // Temizlik hatası kritik değil, devam et
    }
  }
}

module.exports = new AnnouncementDeleteHandler();