const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('throttle-controller');

class ThrottleController extends EventEmitter {
  constructor(maxBytesPerSecond) {
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.tokens = maxBytesPerSecond;
    this.lastRefill = Date.now();
    this.bytesTransferred = 0;
    this.paused = false;
    this.throttleQueue = Promise.resolve();
  }

  async throttle(bytes) {
    return new Promise((resolve) => {
      this.throttleQueue = this.throttleQueue.then(async () => {
        try {
          await this._applyThrottle(bytes);
          resolve();
        } catch (error) {
          logger.error('[THROTTLE] Error during throttling:', error);
          resolve();
        }
      });
    });
  }

  async _applyThrottle(bytes) {
    // Token bucket doldurma
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.maxBytesPerSecond,
      this.tokens + (timePassed * this.maxBytesPerSecond)
    );
    this.lastRefill = now;

    // Token kontrolü
    if (bytes > this.tokens) {
      const requiredDelay = Math.ceil(
        ((bytes - this.tokens) / this.maxBytesPerSecond) * 1000
      );

      if (requiredDelay > 0) {
        this.paused = true;
        logger.debug(`[THROTTLE] Waiting for tokens:`, {
          requiredBytes: bytes,
          availableTokens: this.tokens,
          delay: `${requiredDelay}ms`
        });

        await new Promise(resolve => setTimeout(resolve, requiredDelay));
        
        this.paused = false;
        this.tokens = this.maxBytesPerSecond;
        logger.debug(`[THROTTLE] Tokens refilled after ${requiredDelay}ms delay`);
      }
    }

    this.tokens -= bytes;
    this.bytesTransferred += bytes;
  }

  isPaused() {
    return this.paused;
  }

  setMaxSpeed(maxBytesPerSecond) {
    this.maxBytesPerSecond = maxBytesPerSecond;
    logger.info(`[THROTTLE] Max speed updated to ${(maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`);
  }
}

module.exports = ThrottleController;