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
        activeDownloads: [],
        completedDownloads: []
      }
    });
  }

  initializeDownload(songId, totalSize, tempPath) {
    const downloadState = {
      songId,
      totalSize,
      downloadedSize: 0,
      chunks: [],
      tempPath,
      status: 'initialized',
      timestamp: Date.now(),
      resumePosition: 0
    };

    this.store.set(`downloads.${songId}`, downloadState);
    this.addToActiveDownloads(songId);
    logger.info(`Download initialized for song: ${songId}`);
    return downloadState;
  }

  updateDownloadProgress(songId, chunkSize, chunkIndex) {
    const download = this.getDownloadState(songId);
    if (!download) return;

    download.downloadedSize += chunkSize;
    download.chunks.push(chunkIndex);
    download.resumePosition = download.downloadedSize;
    download.lastUpdate = Date.now();

    this.store.set(`downloads.${songId}`, download);
    logger.debug(`Download progress updated for song: ${songId}, progress: ${Math.round((download.downloadedSize / download.totalSize) * 100)}%`);
  }

  completeDownload(songId) {
    const download = this.getDownloadState(songId);
    if (!download) return;

    download.status = 'completed';
    download.completedAt = Date.now();
    
    this.store.set(`downloads.${songId}`, download);
    this.removeFromActiveDownloads(songId);
    this.addToCompletedDownloads(songId);
    
    logger.info(`Download completed for song: ${songId}`);
  }

  getDownloadState(songId) {
    return this.store.get(`downloads.${songId}`);
  }

  getIncompleteDownloads() {
    const downloads = this.store.get('downloads');
    return Object.entries(downloads)
      .filter(([_, download]) => download.status !== 'completed')
      .map(([songId, download]) => ({
        songId,
        ...download
      }));
  }

  addToActiveDownloads(songId) {
    const activeDownloads = this.store.get('activeDownloads', []);
    if (!activeDownloads.includes(songId)) {
      activeDownloads.push(songId);
      this.store.set('activeDownloads', activeDownloads);
    }
  }

  removeFromActiveDownloads(songId) {
    const activeDownloads = this.store.get('activeDownloads', []);
    this.store.set('activeDownloads', activeDownloads.filter(id => id !== songId));
  }

  addToCompletedDownloads(songId) {
    const completedDownloads = this.store.get('completedDownloads', []);
    if (!completedDownloads.includes(songId)) {
      completedDownloads.push(songId);
      this.store.set('completedDownloads', completedDownloads);
    }
  }

  cleanupTempFiles() {
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
  }
}

module.exports = new DownloadStateManager();