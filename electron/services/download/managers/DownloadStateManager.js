const { createLogger } = require('../../../utils/logger');
const Store = require('electron-store');

const logger = createLogger('download-state-manager');

class DownloadStateManager {
  constructor() {
    this.store = new Store({
      name: 'download-state',
      defaults: { downloads: {} }
    });
  }

  saveState(songId, playlistId, state) {
    const downloads = this.store.get('downloads');
    if (!downloads[playlistId]) {
      downloads[playlistId] = {};
    }
    
    downloads[playlistId][songId] = {
      ...state,
      timestamp: Date.now()
    };
    
    this.store.set('downloads', downloads);
    logger.info(`Saved download state for song ${songId} in playlist ${playlistId}`);
  }

  getState(songId, playlistId) {
    return this.store.get(`downloads.${playlistId}.${songId}`);
  }

  clearState(songId, playlistId) {
    const downloads = this.store.get('downloads');
    if (downloads[playlistId]) {
      delete downloads[playlistId][songId];
      this.store.set('downloads', downloads);
      logger.info(`Cleared download state for song ${songId}`);
    }
  }

  getIncompleteDownloads(playlistId) {
    const downloads = this.store.get(`downloads.${playlistId}`) || {};
    return Object.entries(downloads)
      .filter(([_, state]) => !state.completed)
      .map(([songId, state]) => ({
        songId,
        ...state
      }));
  }
}

module.exports = new DownloadStateManager();