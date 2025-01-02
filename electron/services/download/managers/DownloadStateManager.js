const { EventEmitter } = require('events');
const Store = require('electron-store');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('download-state-manager');

class DownloadStateManager extends EventEmitter {
  constructor() {
    super();
    this.store = new Store({
      name: 'download-states',
      defaults: {
        downloads: {},
        chunks: {},
        playlists: {}
      }
    });
    this.initializeStore();
  }

  initializeStore() {
    if (!this.store.has('downloads')) {
      this.store.set('downloads', {});
    }
    logger.info('DownloadStateManager initialized');
  }

  initializeDownload(songId, playlistId, totalChunks) {
    const downloadState = {
      songId,
      playlistId,
      totalChunks,
      completedChunks: [],
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      lastUpdated: Date.now()
    };

    this.store.set(`downloads.${songId}`, downloadState);
    logger.info(`Download initialized for song: ${songId}`);
    return downloadState;
  }

  updateProgress(songId, chunkIndex) {
    const download = this.store.get(`downloads.${songId}`);
    if (!download) return;

    if (!download.completedChunks.includes(chunkIndex)) {
      download.completedChunks.push(chunkIndex);
      download.progress = (download.completedChunks.length / download.totalChunks) * 100;
      download.lastUpdated = Date.now();
      
      this.store.set(`downloads.${songId}`, download);
      this.emit('progress', { songId, progress: download.progress });
      
      logger.info(`Progress updated for song ${songId}: ${download.progress}%`);
    }
  }

  markAsCompleted(songId) {
    const download = this.store.get(`downloads.${songId}`);
    if (!download) return;

    download.status = 'completed';
    download.progress = 100;
    download.lastUpdated = Date.now();
    download.completedAt = Date.now();

    this.store.set(`downloads.${songId}`, download);
    this.emit('completed', { songId });
    
    logger.info(`Download completed for song: ${songId}`);
  }

  markAsError(songId, error) {
    const download = this.store.get(`downloads.${songId}`);
    if (!download) return;

    download.status = 'error';
    download.error = error;
    download.lastUpdated = Date.now();

    this.store.set(`downloads.${songId}`, download);
    this.emit('error', { songId, error });
    
    logger.error(`Download error for song ${songId}: ${error}`);
  }

  getDownloadState(songId) {
    return this.store.get(`downloads.${songId}`);
  }

  getIncompleteDownloads() {
    const downloads = this.store.get('downloads');
    return Object.values(downloads).filter(
      download => download.status !== 'completed' && download.status !== 'error'
    );
  }

  clearDownload(songId) {
    this.store.delete(`downloads.${songId}`);
    logger.info(`Download state cleared for song: ${songId}`);
  }
}

module.exports = new DownloadStateManager();