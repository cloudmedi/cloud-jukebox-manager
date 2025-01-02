const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

class ThrottleController extends EventEmitter {
  constructor(maxBytesPerSecond) {
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.logger = createLogger('throttle-controller');
    this.tokens = maxBytesPerSecond;
    this.lastRefill = Date.now();
    this.tokenBucketSize = maxBytesPerSecond * 2; // 2 saniyelik buffer
    this.downloadQueue = [];
    
    // Token bucket'ı düzenli olarak doldur
    setInterval(() => this.refillTokens(), 100); // Her 100ms'de bir
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const newTokens = Math.floor(this.maxBytesPerSecond * timePassed);
    
    this.tokens = Math.min(this.tokenBucketSize, this.tokens + newTokens);
    this.lastRefill = now;

    // Bekleyen indirmeleri kontrol et
    this.processQueue();
  }

  async acquireToken(bytes) {
    return new Promise((resolve) => {
      this.downloadQueue.push({ bytes, resolve });
      this.processQueue();
    });
  }

  processQueue() {
    while (this.downloadQueue.length > 0) {
      const { bytes, resolve } = this.downloadQueue[0];
      
      if (this.tokens >= bytes) {
        this.downloadQueue.shift();
        this.tokens -= bytes;
        resolve();
      } else {
        break;
      }
    }
  }

  async updateProgress(downloadId, bytesDownloaded) {
    const now = Date.now();
    const speed = bytesDownloaded / ((now - this.lastRefill) / 1000);

    if (speed > this.maxBytesPerSecond) {
      const delay = Math.ceil((bytesDownloaded / this.maxBytesPerSecond) * 1000) - (now - this.lastRefill);
      
      if (delay > 0) {
        this.logger.warn(`Throttling download:`, {
          downloadId,
          currentSpeed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`,
          maxSpeed: `${(this.maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`,
          delay: `${delay}ms`
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = ThrottleController;