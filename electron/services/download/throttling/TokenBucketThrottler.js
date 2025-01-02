const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('token-bucket-throttler');

class TokenBucketThrottler extends EventEmitter {
  constructor(bytesPerSecond = 2 * 1024 * 1024) { // Default 2MB/s
    super();
    this.bytesPerSecond = bytesPerSecond;
    this.tokens = bytesPerSecond;
    this.lastFill = Date.now();
    this.isProcessing = false;
    this.queue = [];
  }

  async throttle(bytes, downloadId) {
    return new Promise((resolve) => {
      this.queue.push({ bytes, downloadId, resolve });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { bytes, downloadId, resolve } = this.queue[0];

    try {
      await this._throttle(bytes, downloadId);
      this.queue.shift();
      resolve();
    } catch (error) {
      logger.error('Throttling error:', error);
      resolve(); // Resolve anyway to prevent hanging
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  async _throttle(bytes, downloadId) {
    const now = Date.now();
    const timePassed = (now - this.lastFill) / 1000;
    this.tokens = Math.min(
      this.bytesPerSecond,
      this.tokens + timePassed * this.bytesPerSecond
    );
    this.lastFill = now;

    if (bytes > this.tokens) {
      const waitTime = ((bytes - this.tokens) / this.bytesPerSecond) * 1000;
      logger.debug('Throttling download:', {
        downloadId,
        waitTime: `${waitTime}ms`,
        bytes: `${(bytes / (1024 * 1024)).toFixed(2)}MB`,
        availableTokens: `${(this.tokens / (1024 * 1024)).toFixed(2)}MB`
      });
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this._throttle(bytes, downloadId);
    }

    this.tokens -= bytes;
    return true;
  }

  setMaxSpeed(bytesPerSecond) {
    this.bytesPerSecond = bytesPerSecond;
    logger.info(`Max speed updated to ${(bytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`);
  }
}

module.exports = TokenBucketThrottler;