const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const ThrottleController = require('./utils/ThrottleController');

const logger = createLogger('bandwidth-manager');

class BandwidthManager extends EventEmitter {
  constructor() {
    super();
    this.maxConcurrentDownloads = 3;
    this.maxChunkSpeed = 2 * 1024 * 1024; // 2MB/s
    this.activeDownloads = new Map();
    this.throttleController = new ThrottleController(this.maxChunkSpeed);
    
    logger.info('BandwidthManager initialized', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      maxChunkSpeed: `${this.maxChunkSpeed / (1024 * 1024)}MB/s`
    });

    this.setupCleanupInterval();
  }

  setupCleanupInterval() {
    setInterval(() => {
      this.cleanupStaleDownloads();
    }, 30000);
  }

  cleanupStaleDownloads() {
    const now = Date.now();
    for (const [downloadId, download] of this.activeDownloads.entries()) {
      if (now - download.lastActivity > 60000) { // 1 minute timeout
        logger.warn(`Cleaning up stale download: ${downloadId}`);
        this.activeDownloads.delete(downloadId);
      }
    }
  }

  canStartNewDownload() {
    return this.activeDownloads.size < this.maxConcurrentDownloads;
  }

  async startDownload(downloadId) {
    if (!this.canStartNewDownload()) {
      logger.warn('Maximum concurrent downloads reached');
      return false;
    }

    this.activeDownloads.set(downloadId, {
      startTime: Date.now(),
      lastActivity: Date.now(),
      bytesDownloaded: 0,
      currentSpeed: 0
    });

    logger.info(`Started download: ${downloadId}`, {
      activeDownloads: this.activeDownloads.size
    });

    return true;
  }

  async updateProgress(downloadId, bytes) {
    const download = this.activeDownloads.get(downloadId);
    if (!download) return;

    try {
      await this.throttleController.throttle(bytes);
      
      const now = Date.now();
      const timeDiff = (now - download.lastActivity) / 1000;
      
      download.bytesDownloaded += bytes;
      download.currentSpeed = bytes / timeDiff;
      download.lastActivity = now;

      this.activeDownloads.set(downloadId, download);

      logger.debug(`Download progress: ${downloadId}`, {
        bytesDownloaded: download.bytesDownloaded / (1024 * 1024),
        currentSpeed: download.currentSpeed / (1024 * 1024),
        activeDownloads: this.activeDownloads.size
      });

    } catch (error) {
      logger.error(`Error updating download progress: ${downloadId}`, error);
    }
  }

  finishDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (!download) return;

    const totalTime = (Date.now() - download.startTime) / 1000;
    const averageSpeed = download.bytesDownloaded / totalTime;

    logger.info(`Download finished: ${downloadId}`, {
      totalBytes: download.bytesDownloaded / (1024 * 1024),
      totalTime,
      averageSpeed: averageSpeed / (1024 * 1024)
    });

    this.activeDownloads.delete(downloadId);
  }

  cleanup() {
    this.throttleController.cleanup();
    this.activeDownloads.clear();
  }
}

module.exports = new BandwidthManager();