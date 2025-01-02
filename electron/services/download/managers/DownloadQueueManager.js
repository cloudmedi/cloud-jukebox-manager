const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');
const downloadStateManager = require('./DownloadStateManager');
const { chunkManager } = require('./ChunkManager');

const logger = createLogger('download-queue-manager');

class DownloadQueueManager extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.activeDownloads = 0;
  }

  addToQueue(item) {
    this.queue.push(item);
    logger.info(`Added to queue: ${item.song.name}`);
    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.activeDownloads >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0 && this.activeDownloads < this.maxConcurrent) {
        const item = this.queue.shift();
        if (!item) continue;

        this.activeDownloads++;
        this.downloadSong(item).finally(() => {
          this.activeDownloads--;
          this.processQueue();
        });
      }
    } finally {
      this.processing = false;
    }
  }

  async downloadSong({ song, baseUrl, playlistId }) {
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
    
    try {
      const response = await fetch(songUrl, { method: 'HEAD' });
      const fileSize = parseInt(response.headers.get('content-length') || '0', 10);
      
      if (!fileSize) {
        throw new Error('Could not determine file size');
      }

      const chunks = chunkManager.calculateChunks(fileSize);
      downloadStateManager.initializeDownload(song._id, playlistId, chunks.length);

      const downloadPromises = chunks.map(({ start, end }) =>
        chunkManager.downloadChunk(songUrl, start, end, song._id)
      );

      await Promise.all(downloadPromises);
      downloadStateManager.markAsCompleted(song._id);
      this.emit('songCompleted', song);

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      downloadStateManager.markAsError(song._id, error.message);
      this.emit('songError', { song, error });
    }
  }

  clearQueue() {
    this.queue = [];
    logger.info('Download queue cleared');
  }
}

const downloadQueueManager = new DownloadQueueManager();
module.exports = { downloadQueueManager };