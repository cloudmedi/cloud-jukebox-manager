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
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteStarted(entityType, entityId)
      );

      // Silme işlemini gerçekleştir
      await deleteFunction();

      // Başarılı silme bildirimi
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteSuccess(entityType, entityId)
      );

      logger.info(`Successfully deleted ${entityType} with ID: ${entityId}`);
    } catch (error) {
      logger.error(`Error deleting ${entityType}:`, error);
      
      // Hata bildirimi
      this.broadcastDeleteStatus(
        DeleteMessage.createDeleteError(entityType, entityId, error)
      );
      
      throw error;
    }
  }

  broadcastDeleteStatus(message) {
    if (this.wss) {
      this.wss.broadcastToAdmins(message);
    }
  }
}

module.exports = DeleteService;