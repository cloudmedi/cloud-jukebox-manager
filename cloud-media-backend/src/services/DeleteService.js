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
      
      // Önce cihazlara bildir, sonra admin'lere
      if (entityType === 'playlist') {
        logger.info(`Finding and notifying devices about playlist deletion: ${entityId}`);
        const Device = require('../models/Device');
        const devices = await Device.find({ activePlaylist: entityId });
        
        logger.info(`Found ${devices.length} devices using playlist ${entityId}`);
        logger.info('Device tokens:', devices.map(d => d.token));

        // Her cihaza tek tek bildirim gönder
        for (const device of devices) {
          if (this.wss) {
            const message = DeleteMessage.createDeleteStarted('playlist', entityId);
            logger.info(`Sending delete started message to device ${device.token}`);
            const sent = this.wss.sendToDevice(device.token, message);
            logger.info(`Delete started message sent to device ${device.token}: ${sent ? 'Success' : 'Failed'}`);
          }
        }
      }

      // Admin'lere bildir
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteStarted(entityType, entityId)
      );

      // Silme işlemini gerçekleştir
      logger.info(`Executing delete function for ${entityType} ${entityId}`);
      await deleteFunction();

      // Silme başarılı - önce cihazlara bildir
      if (entityType === 'playlist') {
        const Device = require('../models/Device');
        const devices = await Device.find({ activePlaylist: entityId });
        
        for (const device of devices) {
          if (this.wss) {
            const message = DeleteMessage.createDeleteSuccess('playlist', entityId);
            logger.info(`Sending delete success message to device ${device.token}`);
            const sent = this.wss.sendToDevice(device.token, message);
            logger.info(`Delete success message sent to device ${device.token}: ${sent ? 'Success' : 'Failed'}`);
          }
        }
      }

      // Sonra admin'lere bildir
      logger.info(`Broadcasting delete success message for ${entityType} ${entityId}`);
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteSuccess(entityType, entityId)
      );

      logger.info(`Successfully deleted ${entityType} with ID: ${entityId}`);
    } catch (error) {
      logger.error(`Error deleting ${entityType}:`, error);
      
      // Hata durumunda admin'lere bildir
      logger.info(`Broadcasting delete error message for ${entityType} ${entityId}`);
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteError(entityType, entityId, error)
      );
      
      throw error;
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