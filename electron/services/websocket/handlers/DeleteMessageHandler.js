const DeleteManager = require('../../delete/DeleteManager');
const { toast } = require('sonner');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('delete-message-handler');

class DeleteMessageHandler {
  async handleMessage(message) {
    if (message.type !== 'delete') return;

    logger.info('Received delete message:', message);

    try {
      // Silme başladığında toast göster
      if (message.action === 'started') {
        toast.loading('Silme işlemi başlatıldı...', {
          duration: 3000
        });
      }

      // Silme başarılı olduğunda toast göster
      if (message.action === 'success') {
        toast.success('Silme işlemi başarılı', {
          description: 'İçerik başarıyla silindi'
        });
      }

      // Silme hatası olduğunda toast göster
      if (message.action === 'error') {
        toast.error('Silme işlemi başarısız', {
          description: message.error || 'Bir hata oluştu'
        });
      }

      await DeleteManager.handleDelete({
        type: message.entityType,
        id: message.entityId,
        data: message.data
      });
    } catch (error) {
      logger.error('Error handling delete message:', error);
      
      toast.error('Silme işlemi başarısız', {
        description: error.message
      });
    }
  }
}

module.exports = new DeleteMessageHandler();