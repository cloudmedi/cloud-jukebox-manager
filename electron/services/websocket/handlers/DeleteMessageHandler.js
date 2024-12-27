const DeleteManager = require('../../delete/DeleteManager');
const { createLogger } = require('../../../utils/logger');
const { BrowserWindow } = require('electron');

const logger = createLogger('delete-message-handler');

class DeleteMessageHandler {
  async handleMessage(message) {
    if (message.type !== 'delete') return;

    logger.info('Received delete message:', message);

    try {
      // Ana pencereyi bul
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        logger.error('Main window not found');
        return;
      }

      // İşlem başladığında bildirim gönder
      if (message.action === 'started') {
        mainWindow.webContents.send('show-toast', {
          type: 'loading',
          message: 'Silme işlemi başlatıldı...',
          duration: 3000
        });
      }

      // Silme işlemini gerçekleştir
      await DeleteManager.handleDelete({
        type: message.entityType,
        id: message.entityId,
        data: message.data
      });

      // İşlem başarılı olduğunda bildirim gönder
      if (message.action === 'success') {
        mainWindow.webContents.send('show-toast', {
          type: 'success',
          message: 'İçerik başarıyla silindi'
        });
      }

      // Hata durumunda bildirim gönder
      if (message.action === 'error') {
        mainWindow.webContents.send('show-toast', {
          type: 'error',
          message: message.error || 'Bir hata oluştu'
        });
      }

    } catch (error) {
      logger.error('Error handling delete message:', error);
      
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('show-toast', {
          type: 'error',
          message: error.message || 'Silme işlemi başarısız'
        });
      }
    }
  }
}

module.exports = DeleteMessageHandler;