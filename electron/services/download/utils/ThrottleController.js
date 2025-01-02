const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('throttle-controller');

class ThrottleController extends EventEmitter {
  constructor(maxBytesPerSecond = 2 * 1024 * 1024) { // 2MB/s default
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.tokens = maxBytesPerSecond;
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
    this.paused = false;

    // Her 10ms'de bir token yenileme (daha hassas kontrol için)
    this.interval = setInterval(() => this.refillTokens(), 10);
    
    logger.info(`ThrottleController initialized with max speed: ${maxBytesPerSecond / (1024 * 1024)}MB/s`);
  }

  pause() {
    this.paused = true;
    logger.info('Throttling paused');
  }

  resume() {
    this.paused = false;
    this.processQueue();
    logger.info('Throttling resumed');
  }

  refillTokens() {
    if (this.paused) return;

    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.maxBytesPerSecond);
    
    this.tokens = Math.min(this.maxBytesPerSecond, this.tokens + tokensToAdd);
    this.lastRefill = now;

    if (this.tokens > 0 && this.queue.length > 0 && !this.processing) {
      this.processQueue();
    }

    // Log token refill details for debugging
    logger.debug('Tokens refilled', {
      tokensAdded: tokensToAdd,
      currentTokens: this.tokens,
      queueLength: this.queue.length
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0 || this.paused) return;
    this.processing = true;

    try {
      while (this.queue.length > 0 && !this.paused) {
        const { bytes, resolve, reject, timestamp } = this.queue[0];
        
        // Timeout check - 30 saniye
        if (Date.now() - timestamp > 30000) {
          this.queue.shift();
          reject(new Error('Throttle request timeout'));
          continue;
        }

        if (this.tokens < bytes) {
          // Yeterli token yoksa bekle
          await new Promise(resolve => setTimeout(resolve, 10));
          break;
        }

        this.tokens -= bytes;
        this.queue.shift();
        
        // Log successful throttle
        logger.debug('Chunk processed', {
          bytes: bytes,
          remainingTokens: this.tokens,
          queueLength: this.queue.length
        });

        resolve();
      }
    } catch (error) {
      logger.error('Error processing throttle queue:', error);
    } finally {
      this.processing = false;
      if (this.queue.length > 0 && !this.paused) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  async throttle(bytes) {
    if (bytes <= 0) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.queue.push({
        bytes,
        resolve,
        reject,
        timestamp: Date.now()
      });

      logger.debug('Added to throttle queue', {
        bytes: bytes,
        queueLength: this.queue.length
      });

      if (!this.processing && !this.paused) {
        this.processQueue();
      }
    });
  }

  getStatus() {
    return {
      currentTokens: this.tokens,
      queueLength: this.queue.length,
      isProcessing: this.processing,
      isPaused: this.paused,
      maxBytesPerSecond: this.maxBytesPerSecond
    };
  }

  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.queue = [];
    this.processing = false;
    logger.info('ThrottleController cleaned up');
  }
}

module.exports = ThrottleController;