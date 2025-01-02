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
    this.throttleQueue = [];
    this.processing = false;

    // Her 100ms'de bir token'ları yenile
    setInterval(() => this.refillTokens(), 100);
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.maxBytesPerSecond,
      this.tokens + (timePassed * this.maxBytesPerSecond * 0.1) // 100ms için token miktarı
    );
    this.lastRefill = now;

    if (this.tokens > 0 && this.throttleQueue.length > 0 && !this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.throttleQueue.length === 0) return;

    this.processing = true;
    const { bytes, resolve } = this.throttleQueue.shift();

    try {
      await this._applyThrottle(bytes);
      resolve();
    } catch (error) {
      logger.error('[THROTTLE] Error processing queue:', error);
      resolve(); // Hata durumunda da devam et
    } finally {
      this.processing = false;
      if (this.throttleQueue.length > 0) {
        setTimeout(() => this.processQueue(), 50); // 50ms bekle ve devam et
      }
    }
  }

  async throttle(bytes) {
    return new Promise((resolve) => {
      this.throttleQueue.push({ bytes, resolve });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  async _applyThrottle(bytes) {
    if (bytes <= 0) return;

    // Eğer token'lar yetersizse bekle
    while (this.tokens < bytes) {
      const required = bytes - this.tokens;
      const waitTime = (required / this.maxBytesPerSecond) * 1000;
      
      logger.debug(`[THROTTLE] Waiting for tokens:`, {
        requiredBytes: bytes,
        availableTokens: this.tokens,
        waitTime: `${waitTime}ms`
      });

      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
      
      if (this.tokens >= bytes) break;
    }

    this.tokens -= bytes;
    this.bytesTransferred += bytes;

    logger.debug(`[THROTTLE] Bytes processed:`, {
      bytes,
      remainingTokens: this.tokens,
      totalTransferred: this.bytesTransferred
    });
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