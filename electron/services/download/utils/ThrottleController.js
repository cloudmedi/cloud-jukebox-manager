const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('throttle-controller');

class ThrottleController extends EventEmitter {
  constructor(maxBytesPerSecond) {
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.tokens = maxBytesPerSecond;
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
    this.interval = setInterval(() => this.refillTokens(), 100);
    
    logger.info(`ThrottleController initialized with max speed: ${maxBytesPerSecond / (1024 * 1024)}MB/s`);
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.maxBytesPerSecond;
    
    this.tokens = Math.min(this.maxBytesPerSecond, this.tokens + tokensToAdd);
    this.lastRefill = now;

    if (this.tokens > 0 && this.queue.length > 0 && !this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    try {
      const { bytes, resolve } = this.queue[0];
      await this.waitForTokens(bytes);
      this.tokens -= bytes;
      this.queue.shift();
      resolve();
    } catch (error) {
      logger.error('Error processing throttle queue:', error);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  async waitForTokens(bytes) {
    while (this.tokens < bytes) {
      const required = bytes - this.tokens;
      const waitTime = (required / this.maxBytesPerSecond) * 1000;
      
      logger.debug('Waiting for tokens', {
        required: required / (1024 * 1024),
        available: this.tokens / (1024 * 1024),
        waitTime
      });

      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
    }
  }

  async throttle(bytes) {
    return new Promise((resolve) => {
      this.queue.push({ bytes, resolve });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

module.exports = ThrottleController;