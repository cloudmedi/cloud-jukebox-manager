const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

class BaseDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.logger = createLogger('base-download-manager');
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.isProcessing = false;
  }

  async queueDownload(item) {
    this.logger.info(`Adding item to queue: ${item.id}`);
    this.downloadQueue.push(item);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      while (this.downloadQueue.length > 0) {
        const download = this.downloadQueue.shift();
        if (download) {
          this.activeDownloads.set(download.id, download);
          try {
            await this.processDownload(download);
            this.emit('downloadComplete', download.id);
          } catch (error) {
            this.logger.error(`Download error: ${error.message}`);
            this.emit('downloadError', { id: download.id, error });
          } finally {
            this.activeDownloads.delete(download.id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async processDownload(download) {
    throw new Error('processDownload must be implemented by child class');
  }
}

module.exports = BaseDownloadManager;