const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('download-state-manager');

class DownloadStateManager {
  constructor() {
    this.store = new Store({
      name: 'download-state',
      defaults: {
        downloads: {},
        songDetails: {},
        chunks: {},
        playlists: {}
      }
    });
  }

  saveSongDetails(songId, details) {
    try {
      if (!songId || !details) {
        throw new Error('Invalid song details provided');
      }

      logger.info(`Saving song details for ${songId}`);
      this.store.set(`songDetails.${songId}`, {
        ...details,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`Error saving song details for ${songId}:`, error);
      throw error;
    }
  }

  getSongDetails(songId) {
    try {
      const details = this.store.get(`songDetails.${songId}`);
      if (!details) {
        logger.warn(`No song details found for ${songId}`);
      }
      return details;
    } catch (error) {
      logger.error(`Error getting song details for ${songId}:`, error);
      return null;
    }
  }

  initializeDownload(songId, totalSize, tempPath) {
    try {
      logger.info(`Initializing download for song ${songId}`);
      const downloadState = {
        songId,
        totalSize,
        downloadedSize: 0,
        chunks: [],
        tempPath,
        status: 'initialized',
        timestamp: Date.now(),
        resumePosition: 0,
        retryCount: 0
      };

      this.store.set(`downloads.${songId}`, downloadState);
      return downloadState;
    } catch (error) {
      logger.error(`Error initializing download for ${songId}:`, error);
      throw error;
    }
  }

  updateDownloadProgress(songId, chunkSize, chunkIndex) {
    try {
      const download = this.getDownloadState(songId);
      if (!download) {
        logger.warn(`No download state found for ${songId}`);
        return;
      }

      download.downloadedSize += chunkSize;
      download.chunks.push(chunkIndex);
      download.resumePosition = download.downloadedSize;
      download.lastUpdate = Date.now();

      this.store.set(`downloads.${songId}`, download);
      logger.debug(`Updated progress for song ${songId}: ${download.downloadedSize}/${download.totalSize}`);
    } catch (error) {
      logger.error(`Error updating download progress for ${songId}:`, error);
    }
  }

  getDownloadState(songId) {
    return this.store.get(`downloads.${songId}`);
  }

  getIncompleteDownloads() {
    try {
      const downloads = this.store.get('downloads', {});
      return Object.entries(downloads)
        .filter(([_, download]) => download.status !== 'completed')
        .map(([songId, download]) => ({
          songId,
          ...download,
          ...this.getSongDetails(songId)
        }));
    } catch (error) {
      logger.error('Error getting incomplete downloads:', error);
      return [];
    }
  }

  completeDownload(songId) {
    try {
      const download = this.getDownloadState(songId);
      if (!download) return;

      download.status = 'completed';
      download.completedAt = Date.now();
      
      this.store.set(`downloads.${songId}`, download);
      logger.info(`Marked download as completed for song: ${songId}`);
    } catch (error) {
      logger.error(`Error completing download for ${songId}:`, error);
    }
  }

  cleanupTempFiles() {
    try {
      const downloads = this.store.get('downloads', {});
      Object.values(downloads).forEach(download => {
        if (download.tempPath && fs.existsSync(download.tempPath)) {
          try {
            fs.unlinkSync(download.tempPath);
            logger.info(`Cleaned up temp file: ${download.tempPath}`);
          } catch (error) {
            logger.error(`Error cleaning up temp file: ${download.tempPath}`, error);
          }
        }
      });
    } catch (error) {
      logger.error('Error during temp files cleanup:', error);
    }
  }
}

module.exports = new DownloadStateManager();