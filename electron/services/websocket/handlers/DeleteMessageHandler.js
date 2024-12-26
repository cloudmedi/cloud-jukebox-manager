const DeleteManager = require('../../delete/DeleteManager');

class DeleteMessageHandler {
  async handleMessage(message) {
    if (message.type !== 'delete') return;

    console.log('Received delete message:', message);

    try {
      await DeleteManager.handleDelete({
        type: message.entityType,
        id: message.entityId,
        data: message.data
      });
    } catch (error) {
      console.error('Error handling delete message:', error);
    }
  }
}

module.exports = new DeleteMessageHandler();