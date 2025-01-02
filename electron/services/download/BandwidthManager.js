const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('bandwidth-manager');

class BandwidthManager extends EventEmitter {
  constructor() {
    super();
    this.maxConcurrentDownloads = 3;
    this.maxChunkSpeed = 2 * 1024 * 1024; // 2MB/s
    this.downloadPriority = 'low';
    this.activeDownloads = 0;
    
    logger.info('BandwidthManager initialized with:', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      maxChunkSpeed: `${this.maxChunkSpeed / (1024 * 1024)}MB/s`,
      downloadPriority: this.downloadPriority
    });
  }

  canStartNewDownload() {
    const canStart = this.activeDownloads < this.maxConcurrentDownloads;
    logger.debug(`Checking if can start new download:`, {
      activeDownloads: this.activeDownloads,
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      canStart
    });
    return canStart;
  }

  startDownload() {
    if (this.canStartNewDownload()) {
      this.activeDownloads++;
      logger.info(`Starting new download:`, {
        activeDownloads: this.activeDownloads,
        remainingSlots: this.maxConcurrentDownloads - this.activeDownloads
      });
      return true;
    }
    logger.warn(`Cannot start new download: maximum concurrent downloads reached`);
    return false;
  }

  finishDownload() {
    if (this.activeDownloads > 0) {
      this.activeDownloads--;
      logger.info(`Finished download:`, {
        activeDownloads: this.activeDownloads,
        availableSlots: this.maxConcurrentDownloads - this.activeDownloads
      });
    }
  }

  getThrottleSpeed() {
    return this.maxChunkSpeed;
  }

  setPriority(priority) {
    this.downloadPriority = priority;
    logger.info(`Download priority changed:`, { priority });
  }
}

module.exports = new BandwidthManager();