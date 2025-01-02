const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const { downloadStateManager } = require('./managers/DownloadStateManager');
const { chunkManager } = require('./managers/ChunkManager');
const { downloadQueueManager } = require('./managers/DownloadQueueManager');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    logger.info('ChunkDownloadManager initialized');
    this.setupEventListeners();
    this.resumeIncompleteDownloads();
  }

  setupEventListeners() {
    downloadStateManager.on('progress', ({ songId, progress }) => {
      this.emit('progress', { songId, progress });
    });

    downloadStateManager.on('completed', ({ songId }) => {
      this.emit('songCompleted', songId);
    });

    downloadStateManager.on('error', ({ songId, error }) => {
      this.emit('error', { songId, error });
    });
  }

  async resumeIncompleteDownloads() {
    const incomplete = downloadStateManager.getIncompleteDownloads();
    logger.info(`Found ${incomplete.length} incomplete downloads to resume`);
    
    // Resume logic will be implemented in the next iteration
  }

  async downloadSong(song, baseUrl, playlistId) {
    downloadQueueManager.addToQueue({
      song,
      baseUrl,
      playlistId
    });
  }

  cancelDownload(songId) {
    // Cancel logic will be implemented in the next iteration
  }

  getDownloadState(songId) {
    return downloadStateManager.getState(songId);
  }
}

module.exports = new ChunkDownloadManager();
