const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playlist-handler');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylist(message) {
    try {
      logger.info('Handling playlist message:', message);

      // Playlist silme işlemi
      if (message.action === 'deleted') {
        return this.handlePlaylistDeletion(message.playlistId);
      }

      // Normal playlist işleme
      const playlist = message.playlist;
      if (!playlist || !playlist.name) {
        throw new Error('Invalid playlist data received');
      }

      // Download and process songs logic here...

    } catch (error) {
      logger.error('Error handling playlist:', error);
      throw error;
    }
  }

  handlePlaylistDeletion(playlistId) {
    try {
      logger.info(`Handling playlist deletion for ID: ${playlistId}`);

      // Local storage'dan playlist'i sil
      const playlists = store.get('playlists', []);
      const updatedPlaylists = playlists.filter(p => p._id !== playlistId);
      store.set('playlists', updatedPlaylists);

      // Playlist klasörünü sil
      const playlistDir = path.join(this.downloadPath, playlistId);
      if (fs.existsSync(playlistDir)) {
        fs.rmSync(playlistDir, { recursive: true, force: true });
        logger.info(`Deleted playlist directory: ${playlistDir}`);
      }

      logger.info('Playlist deletion completed successfully');
      return { success: true, message: 'Playlist deleted' };
    } catch (error) {
      logger.error('Error handling playlist deletion:', error);
      throw error;
    }
  }

  async downloadFile(url, filePath) {
    // File download logic here...
  }
}

module.exports = new PlaylistHandler();
