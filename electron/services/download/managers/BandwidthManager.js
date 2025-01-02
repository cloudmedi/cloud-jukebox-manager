const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('bandwidth-manager');

class BandwidthManager extends EventEmitter {
  constructor() {
    super();
    this.maxConcurrentDownloads = 3;
    this.maxChunkSpeed = 2 * 1024 * 1024; // 2MB/s
    this.downloadPriority = 'low';
    this.activeDownloads = 0;
    this.downloadStats = new Map();
    
    logger.info('[BANDWIDTH INIT] Manager initialized with:', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      maxChunkSpeed: `${this.maxChunkSpeed / (1024 * 1024)}MB/s`,
      downloadPriority: this.downloadPriority
    });

    setInterval(() => this.logBandwidthStatus(), 5000);
  }

  canStartNewDownload() {
    const canStart = this.activeDownloads < this.maxConcurrentDownloads;
    logger.info('[BANDWIDTH CHECK]', {
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
      
      logger.info('[DOWNLOAD START]', {
        downloadId,
        activeDownloads: this.activeDownloads,
        remainingSlots: this.maxConcurrentDownloads - this.activeDownloads
      });
      return true;
    }
    return false;
  }

  updateProgress(downloadId, bytesDownloaded) {
    const stats = this.downloadStats.get(downloadId);
    if (stats) {
      const now = Date.now();
      const timeDiff = (now - stats.lastUpdate) / 1000;
      const bytesDiff = bytesDownloaded - stats.bytesDownloaded;
      const currentSpeed = bytesDiff / timeDiff;
      
      if (currentSpeed > this.maxChunkSpeed) {
        logger.warn('[SPEED LIMIT]', {
          downloadId,
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          maxSpeed: `${(this.maxChunkSpeed / (1024 * 1024)).toFixed(2)}MB/s`
        });
      }
      
      if (Math.floor(bytesDownloaded / (1024 * 1024)) > Math.floor(stats.bytesDownloaded / (1024 * 1024))) {
        logger.info('[DOWNLOAD PROGRESS]', {
          downloadId,
          totalDownloaded: `${(bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`,
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`
        });
      }

      this.downloadStats.set(downloadId, {
        ...stats,
        bytesDownloaded,
        currentSpeed,
        lastUpdate: now
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
        
        logger.info('[DOWNLOAD COMPLETE]', {
          downloadId,
          totalBytes: `${(stats.bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`,
          totalTime: `${totalTime.toFixed(2)}s`,
          averageSpeed: `${(averageSpeed / (1024 * 1024)).toFixed(2)}MB/s`
        });
        
        this.downloadStats.delete(downloadId);
      }
    }
  }

  logBandwidthStatus() {
    if (this.activeDownloads > 0) {
      const stats = Array.from(this.downloadStats.entries()).map(([id, stat]) => ({
        downloadId: id,
        speed: `${(stat.currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
        downloaded: `${(stat.bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`
      }));
      
      logger.info('[BANDWIDTH STATUS]', {
        activeDownloads: this.activeDownloads,
        maxConcurrentDownloads: this.maxConcurrentDownloads,
        downloads: stats
      });
    }
  }
}

module.exports = new BandwidthManager();