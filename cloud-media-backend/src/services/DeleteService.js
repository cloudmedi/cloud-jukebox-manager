const DeleteMessage = require('../websocket/messages/DeleteMessage');
const { createLogger } = require('../utils/logger');

const logger = createLogger('delete-service');

class DeleteService {
  constructor(wss) {
    this.wss = wss;
  }

  async handleDelete(entityType, entityId, deleteFunction) {
    logger.info(`Starting delete operation for ${entityType} with ID: ${entityId}`);

    try {
      // Silme başladı bildirimi
      logger.info(`Broadcasting delete started message for ${entityType} ${entityId}`);
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteStarted(entityType, entityId)
      );

      // İlgili cihazlara silme başladı bildirimi gönder
      if (entityType === 'playlist') {
        await this.notifyDevicesForPlaylist(entityId, 'started');
      }

      // Silme işlemini gerçekleştir
      logger.info(`Executing delete function for ${entityType} ${entityId}`);
      await deleteFunction();

      // İlgili cihazlara silme tamamlandı bildirimi gönder
      if (entityType === 'playlist') {
        await this.notifyDevicesForPlaylist(entityId, 'success');
      }

      // Başarılı silme bildirimi
      logger.info(`Broadcasting delete success message for ${entityType} ${entityId}`);
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteSuccess(entityType, entityId)
      );

      logger.info(`Successfully deleted ${entityType} with ID: ${entityId}`);
    } catch (error) {
      logger.error(`Error deleting ${entityType}:`, error);
      
      // Hata bildirimi
      logger.info(`Broadcasting delete error message for ${entityType} ${entityId}`);
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteError(entityType, entityId, error)
      );
      
      throw error;
    }
  }

  async notifyDevicesForPlaylist(playlistId, action) {
    try {
      const Device = require('../models/Device');
      
      // Playlist'i kullanan cihazları bul
      const devices = await Device.find({ activePlaylist: playlistId });
      
      logger.info(`Found ${devices.length} devices using playlist ${playlistId}`);
      
      // Her cihaza bildirim gönder
      devices.forEach(device => {
        if (this.wss) {
          const message = action === 'started' 
            ? DeleteMessage.createDeleteStarted('playlist', playlistId)
            : DeleteMessage.createDeleteSuccess('playlist', playlistId);
            
          const sent = this.wss.sendToDevice(device.token, message);
          logger.info(`Delete ${action} message sent to device ${device.token}: ${sent}`);
        }
      });
    } catch (error) {
      logger.error('Error notifying devices:', error);
    }
  }

  broadcastDeleteStatus(message) {
    if (this.wss) {
      logger.info('Broadcasting delete status message:', message);
      this.wss.broadcastToAdmins(message);
    } else {
      logger.warn('WebSocket server not available for broadcasting');
    }
  }
}

module.exports = DeleteService;