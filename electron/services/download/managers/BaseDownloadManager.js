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

  async queueSongDownload(song, baseUrl, playlistDir, isResume = false) {
    this.logger.info(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistDir, isResume });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return;
    }

    this.isProcessing = true;
    try {
      while (this.downloadQueue.length > 0 && 
             this.activeDownloads.size < this.maxConcurrentDownloads) {
        const download = this.downloadQueue.shift();
        if (download) {
          const { song, baseUrl, playlistDir } = download;
          this.activeDownloads.set(song._id, download);
          
          try {
            await this.downloadSong(song, baseUrl, playlistDir);
            this.emit('songDownloaded', song._id);
          } finally {
            this.activeDownloads.delete(song._id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    }
  }
}

module.exports = BaseDownloadManager;