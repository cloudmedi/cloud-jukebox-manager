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
    this.downloadStats = new Map(); // Track download speeds
    
    logger.info('BandwidthManager initialized with:', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      maxChunkSpeed: `${this.maxChunkSpeed / (1024 * 1024)}MB/s`,
      downloadPriority: this.downloadPriority
    });

    // Log stats every 5 seconds
    setInterval(() => this.logStats(), 5000);
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

  startDownload(downloadId) {
    if (this.canStartNewDownload()) {
      this.activeDownloads++;
      this.downloadStats.set(downloadId, {
        startTime: Date.now(),
        bytesDownloaded: 0,
        currentSpeed: 0
      });
      
      logger.info(`Starting new download:`, {
        downloadId,
        activeDownloads: this.activeDownloads,
        remainingSlots: this.maxConcurrentDownloads - this.activeDownloads
      });
      return true;
    }
    
    logger.warn(`Cannot start new download: maximum concurrent downloads reached`, {
      downloadId,
      activeDownloads: this.activeDownloads
    });
    return false;
  }

  updateProgress(downloadId, bytesDownloaded) {
    const stats = this.downloadStats.get(downloadId);
    if (stats) {
      const now = Date.now();
      const timeDiff = (now - stats.startTime) / 1000; // Convert to seconds
      const speed = bytesDownloaded / timeDiff;
      
      this.downloadStats.set(downloadId, {
        ...stats,
        bytesDownloaded,
        currentSpeed: speed
      });
    }
  }

  finishDownload(downloadId) {
    if (this.activeDownloads > 0) {
      this.activeDownloads--;
      const stats = this.downloadStats.get(downloadId);
      if (stats) {
        const totalTime = (Date.now() - stats.startTime) / 1000;
        const averageSpeed = stats.bytesDownloaded / totalTime;
        
        logger.info(`Download finished:`, {
          downloadId,
          totalBytes: stats.bytesDownloaded,
          totalTime: `${totalTime.toFixed(2)}s`,
          averageSpeed: `${(averageSpeed / (1024 * 1024)).toFixed(2)}MB/s`
        });
        
        this.downloadStats.delete(downloadId);
      }
    }
  }

  logStats() {
    if (this.activeDownloads > 0) {
      const stats = Array.from(this.downloadStats.entries()).map(([id, stat]) => ({
        downloadId: id,
        speed: `${(stat.currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
        downloaded: `${(stat.bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`
      }));
      
      logger.info(`Current download stats:`, {
        activeDownloads: this.activeDownloads,
        stats
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