const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('download-state-manager');

class DownloadStateManager {
  constructor() {
    this.store = new Store({
      name: 'download-state',
      defaults: {
        downloads: {}
      }
    });
  }

  saveDownloadState(playlistId, songId, {
    downloadedChunks,
    totalChunks,
    tempPath,
    finalPath,
    checksum,
    retryCount = 0,
    lastError = null
  }) {
    logger.info(`Saving download state for song ${songId} in playlist ${playlistId}`);
    
    const downloads = this.store.get('downloads');
    if (!downloads[playlistId]) {
      downloads[playlistId] = {};
    }

    downloads[playlistId][songId] = {
      downloadedChunks,
      totalChunks,
      tempPath,
      finalPath,
      checksum,
      retryCount,
      lastError,
      timestamp: Date.now()
    };

    this.store.set('downloads', downloads);
  }

  getDownloadState(playlistId, songId) {
    return this.store.get(`downloads.${playlistId}.${songId}`);
  }

  getPlaylistDownloadState(playlistId) {
    return this.store.get(`downloads.${playlistId}`) || {};
  }

  clearDownloadState(playlistId, songId) {
    const downloads = this.store.get('downloads');
    if (downloads[playlistId]) {
      delete downloads[playlistId][songId];
      if (Object.keys(downloads[playlistId]).length === 0) {
        delete downloads[playlistId];
      }
      this.store.set('downloads', downloads);
    }
  }

  clearPlaylistDownloadState(playlistId) {
    const downloads = this.store.get('downloads');
    delete downloads[playlistId];
    this.store.set('downloads', downloads);
  }

  isDownloadComplete(playlistId, songId) {
    const state = this.getDownloadState(playlistId, songId);
    return state && state.downloadedChunks === state.totalChunks;
  }

  getIncompleteDownloads(playlistId) {
    const downloads = this.getPlaylistDownloadState(playlistId);
    return Object.entries(downloads)
      .filter(([_, state]) => state.downloadedChunks < state.totalChunks)
      .map(([songId, state]) => ({
        songId,
        ...state
      }));
  }

  cleanup() {
    const downloads = this.store.get('downloads');
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Clean up old temporary files and their states
    Object.entries(downloads).forEach(([playlistId, playlistDownloads]) => {
      Object.entries(playlistDownloads).forEach(([songId, state]) => {
        if (now - state.timestamp > ONE_DAY) {
          if (state.tempPath && fs.existsSync(state.tempPath)) {
            try {
              fs.unlinkSync(state.tempPath);
            } catch (error) {
              logger.error(`Error deleting temp file: ${error.message}`);
            }
          }
          this.clearDownloadState(playlistId, songId);
        }
      });
    });
  }
}

module.exports = new DownloadStateManager();