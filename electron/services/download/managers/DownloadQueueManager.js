const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('download-queue-manager');

class DownloadQueueManager extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.activeDownloads = 0;
    logger.info('DownloadQueueManager initialized');
  }

  addToQueue(item) {
    logger.info(`Adding to queue: ${item.song.name}`);
    
    if (item.priority === 'high') {
      this.queue.unshift(item);
      logger.info('Added with high priority');
    } else {
      this.queue.push(item);
      logger.info('Added with normal priority');
    }
    
    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.activeDownloads >= this.maxConcurrent) {
      logger.info('Queue processing skipped - already processing or max concurrent reached');
      return;
    }

    this.processing = true;
    logger.info('Starting queue processing');

    try {
      while (this.queue.length > 0 && this.activeDownloads < this.maxConcurrent) {
        const item = this.queue.shift();
        if (!item) continue;

        this.activeDownloads++;
        logger.info(`Processing download for: ${item.song.name}`);
        
        try {
          await this.downloadSong(item);
        } catch (error) {
          logger.error(`Error downloading song: ${item.song.name}`, error);
        } finally {
          this.activeDownloads--;
          this.processQueue();
        }
      }
    } finally {
      this.processing = false;
      logger.info('Queue processing completed');
    }
  }

  async downloadSong({ song, baseUrl, playlistId }) {
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
    logger.info(`Starting download: ${songUrl}`);
    
    try {
      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const downloadDir = path.join(require('electron').app.getPath('userData'), 'downloads', playlistId);
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const filePath = path.join(downloadDir, `${song._id}.mp3`);
      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`Download completed: ${song.name}`);
          song.localPath = filePath;
          this.emit('songCompleted', song);
          resolve();
        });

        writer.on('error', (error) => {
          logger.error(`Download error for ${song.name}:`, error);
          this.emit('songError', { song, error });
          reject(error);
        });
      });

    } catch (error) {
      logger.error(`Download failed for ${song.name}:`, error);
      this.emit('songError', { song, error });
      throw error;
    }
  }

  clearQueue() {
    this.queue = [];
    logger.info('Download queue cleared');
  }
}

module.exports = new DownloadQueueManager();