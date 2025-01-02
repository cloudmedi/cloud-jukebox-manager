const TokenBucket = require('./TokenBucket');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('speed-limiter');

class SpeedLimiter {
  constructor(maxBytesPerSecond = 2 * 1024 * 1024) { // Default 2MB/s
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.tokenBucket = new TokenBucket(maxBytesPerSecond, maxBytesPerSecond);
    this.activeDownloads = new Map();
  }

  async throttle(downloadId, bytes) {
    try {
      const start = Date.now();
      await this.tokenBucket.consumeTokens(bytes);
      
      const downloadStats = this.activeDownloads.get(downloadId) || {
        bytesDownloaded: 0,
        startTime: Date.now()
      };
      
      downloadStats.bytesDownloaded += bytes;
      this.activeDownloads.set(downloadId, downloadStats);

      const elapsed = (Date.now() - start) / 1000;
      const currentSpeed = bytes / elapsed;

      if (currentSpeed > this.maxBytesPerSecond) {
        logger.warn(`[THROTTLE] Speed exceeded limit for download ${downloadId}:`, {
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          maxSpeed: `${(this.maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`,
          bytes: `${(bytes / (1024 * 1024)).toFixed(2)}MB`
        });
      }
    } catch (error) {
      logger.error(`[THROTTLE] Error throttling download ${downloadId}:`, error);
      throw error;
    }
  }

  getDownloadStats(downloadId) {
    return this.activeDownloads.get(downloadId);
  }

  setMaxSpeed(maxBytesPerSecond) {
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.tokenBucket = new TokenBucket(maxBytesPerSecond, maxBytesPerSecond);
    logger.info(`[THROTTLE] Max speed updated to ${(maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`);
  }

  clearDownload(downloadId) {
    this.activeDownloads.delete(downloadId);
  }
}

module.exports = new SpeedLimiter();