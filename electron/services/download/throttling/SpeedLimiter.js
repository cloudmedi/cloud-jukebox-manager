const TokenBucketThrottler = require('./TokenBucketThrottler');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('speed-limiter');

class SpeedLimiter {
  constructor(maxBytesPerSecond = 2 * 1024 * 1024) { // Default 2MB/s
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.throttler = new TokenBucketThrottler(maxBytesPerSecond);
    this.downloadStats = new Map();
  }

  async throttle(downloadId, bytes) {
    try {
      const start = Date.now();
      await this.throttler.throttle(bytes, downloadId);
      
      const downloadStats = this.downloadStats.get(downloadId) || {
        bytesDownloaded: 0,
        startTime: Date.now()
      };
      
      downloadStats.bytesDownloaded += bytes;
      this.downloadStats.set(downloadId, downloadStats);

      const elapsed = (Date.now() - start) / 1000;
      const currentSpeed = bytes / elapsed;

      if (currentSpeed > this.maxBytesPerSecond) {
        logger.warn(`[THROTTLE] Speed exceeded limit for download ${downloadId}:`, {
          bytes: `${(bytes / (1024 * 1024)).toFixed(2)}MB`,
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          maxSpeed: `${(this.maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`
        });
      }
    } catch (error) {
      logger.error(`[THROTTLE] Error throttling download ${downloadId}:`, error);
      throw error;
    }
  }

  getDownloadStats(downloadId) {
    return this.downloadStats.get(downloadId);
  }

  setMaxSpeed(maxBytesPerSecond) {
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.throttler.setMaxSpeed(maxBytesPerSecond);
    logger.info(`[THROTTLE] Max speed updated to ${(maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`);
  }

  clearDownload(downloadId) {
    this.downloadStats.delete(downloadId);
  }
}

module.exports = new SpeedLimiter();