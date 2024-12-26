const DeleteManager = require('../../delete/DeleteManager');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('DeleteMessageHandler');

class DeleteMessageHandler {
  async handleMessage(message) {
    if (message.type !== 'delete') return;

    logger.info('Received delete message:', message);

    try {
      await DeleteManager.handleDelete({
        type: message.entityType,
        id: message.entityId,
        data: message.data
      });
    } catch (error) {
      logger.error('Error handling delete message:', error);
    }
  }
}

module.exports = new DeleteMessageHandler();