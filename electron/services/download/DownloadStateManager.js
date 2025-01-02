const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

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
    this.store.set(`songDetails.${songId}`, details);
    logger.info(`Saved details for song: ${songId}`);
  }

  getSongDetails(songId) {
    return this.store.get(`songDetails.${songId}`);
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
    logger.info(`Initialized download state for song: ${songId}`);
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
    logger.debug(`Updated progress for song ${songId}`);
  }

  getDownloadState(songId) {
    return this.store.get(`downloads.${songId}`);
  }

  getIncompleteDownloads() {
    const downloads = this.store.get('downloads', {});
    return Object.entries(downloads)
      .filter(([_, download]) => download.status !== 'completed')
      .map(([songId, download]) => ({
        songId,
        ...download,
        ...this.getSongDetails(songId)
      }));
  }

  completeDownload(songId) {
    const download = this.getDownloadState(songId);
    if (!download) return;

    download.status = 'completed';
    download.completedAt = Date.now();
    
    this.store.set(`downloads.${songId}`, download);
    logger.info(`Marked download as completed for song: ${songId}`);
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