const DeleteManager = require('../../delete/DeleteManager');
const { createLogger } = require('../../../utils/logger');
const Store = require('electron-store');
const { BrowserWindow } = require('electron');

const logger = createLogger('DeleteMessageHandler');
const store = new Store();

class DeleteMessageHandler {
  async handleMessage(message) {
    if (message.type !== 'delete') return;

    logger.info('Received delete message:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];

    try {
      switch (message.action) {
        case 'started':
          logger.info(`Delete operation started for ${message.entityType}: ${message.entityId}`);
          if (message.entityType === 'playlist') {
            // Playlist silme başladığında UI'ı güncelle
            mainWindow?.webContents.send('playlist-delete-started', message.entityId);
          }
          break;

        case 'success':
          logger.info(`Delete operation successful for ${message.entityType}: ${message.entityId}`);
          if (message.entityType === 'playlist') {
            // Playlist başarıyla silindiğinde store'dan kaldır
            const playlists = store.get('playlists', []);
            const updatedPlaylists = playlists.filter(p => p._id !== message.entityId);
            store.set('playlists', updatedPlaylists);
            
            // UI'ı güncelle
            mainWindow?.webContents.send('playlist-deleted', message.entityId);
            
            // Eğer silinen playlist şu an çalıyorsa durdur
            const currentPlaylist = store.get('currentPlaylist');
            if (currentPlaylist && currentPlaylist._id === message.entityId) {
              mainWindow?.webContents.send('stop-playback');
              store.delete('currentPlaylist');
            }
          }
          break;

        case 'error':
          logger.error(`Delete operation failed for ${message.entityType}:`, message.error);
          mainWindow?.webContents.send('delete-error', {
            type: message.entityType,
            id: message.entityId,
            error: message.error
          });
          break;
      }
    } catch (error) {
      logger.error('Error handling delete message:', error);
    }
  }
}

module.exports = new DeleteMessageHandler();