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
    logger.debug(`[BANDWIDTH CHECK] Can start new download:`, {
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
        currentSpeed: 0,
        lastUpdate: Date.now()
      });
      
      logger.info(`[DOWNLOAD START] New download started:`, {
        downloadId,
        activeDownloads: this.activeDownloads,
        remainingSlots: this.maxConcurrentDownloads - this.activeDownloads,
        priority: this.downloadPriority
      });
      return true;
    }
    
    logger.warn(`[BANDWIDTH LIMIT] Cannot start new download: maximum concurrent downloads reached`, {
      downloadId,
      activeDownloads: this.activeDownloads,
      maxLimit: this.maxConcurrentDownloads
    });
    return false;
  }

  updateProgress(downloadId, bytesDownloaded) {
    const stats = this.downloadStats.get(downloadId);
    if (stats) {
      const now = Date.now();
      const timeDiff = (now - stats.lastUpdate) / 1000; // Convert to seconds
      const bytesDiff = bytesDownloaded - stats.bytesDownloaded;
      const currentSpeed = bytesDiff / timeDiff;
      
      // Check if speed exceeds limit
      if (currentSpeed > this.maxChunkSpeed) {
        logger.warn(`[SPEED LIMIT] Download speed exceeds limit:`, {
          downloadId,
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          maxSpeed: `${(this.maxChunkSpeed / (1024 * 1024)).toFixed(2)}MB/s`
        });
      }
      
      this.downloadStats.set(downloadId, {
        ...stats,
        bytesDownloaded,
        currentSpeed,
        lastUpdate: now
      });

      // Log progress every 1MB
      if (Math.floor(bytesDownloaded / (1024 * 1024)) > Math.floor(stats.bytesDownloaded / (1024 * 1024))) {
        logger.info(`[DOWNLOAD PROGRESS] Download progress update:`, {
          downloadId,
          totalDownloaded: `${(bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`,
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`
        });
      }
    }
  }

  finishDownload(downloadId) {
    if (this.activeDownloads > 0) {
      this.activeDownloads--;
      const stats = this.downloadStats.get(downloadId);
      if (stats) {
        const totalTime = (Date.now() - stats.startTime) / 1000;
        const averageSpeed = stats.bytesDownloaded / totalTime;
        
        logger.info(`[DOWNLOAD COMPLETE] Download finished:`, {
          downloadId,
          totalBytes: `${(stats.bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`,
          totalTime: `${totalTime.toFixed(2)}s`,
          averageSpeed: `${(averageSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          remainingActiveDownloads: this.activeDownloads
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
      
      logger.info(`[BANDWIDTH STATUS] Current download stats:`, {
        activeDownloads: this.activeDownloads,
        maxConcurrentDownloads: this.maxConcurrentDownloads,
        priority: this.downloadPriority,
        downloads: stats
      });
    }
  }

  getThrottleSpeed() {
    return this.maxChunkSpeed;
  }

  setPriority(priority) {
    this.downloadPriority = priority;
    logger.info(`[PRIORITY CHANGE] Download priority changed:`, { priority });
  }
}

module.exports = new BandwidthManager();