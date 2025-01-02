const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('throttle-controller');

class ThrottleController extends EventEmitter {
  constructor(maxBytesPerSecond) {
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.bytesTransferred = 0;
    this.lastCheck = Date.now();
    this.paused = false;
    this.throttleQueue = Promise.resolve();
  }

  async throttle(bytes) {
    // Queue'ya ekle ve sırayla işle
    return new Promise((resolve) => {
      this.throttleQueue = this.throttleQueue.then(async () => {
        try {
          await this._applyThrottle(bytes);
          resolve();
        } catch (error) {
          logger.error('[THROTTLE] Error during throttling:', error);
          resolve(); // Hata durumunda bile devam et
        }
      });
    });
  }

  async _applyThrottle(bytes) {
    this.bytesTransferred += bytes;
    const now = Date.now();
    const duration = (now - this.lastCheck) / 1000;
    const currentSpeed = this.bytesTransferred / duration;

    if (currentSpeed > this.maxBytesPerSecond) {
      const requiredDelay = Math.ceil(
        (this.bytesTransferred / this.maxBytesPerSecond) * 1000 - (now - this.lastCheck)
      );

      if (requiredDelay > 0) {
        this.paused = true;
        logger.debug(`[THROTTLE] Applying throttle:`, {
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          maxSpeed: `${(this.maxBytesPerSecond / (1024 * 1024)).toFixed(2)}MB/s`,
          delay: `${requiredDelay}ms`,
          bytesTransferred: `${(this.bytesTransferred / 1024).toFixed(2)}KB`
        });

        // Progressive delay - hız aşımı arttıkça delay'i artır
        const progressiveDelay = requiredDelay * (currentSpeed / this.maxBytesPerSecond);
        
        await new Promise(resolve => setTimeout(resolve, progressiveDelay));
        
        this.paused = false;
        this.bytesTransferred = 0;
        this.lastCheck = Date.now();
        
        logger.debug(`[THROTTLE] Throttle released after ${progressiveDelay}ms delay`);
      }
    }

    // Her saniye başında veya büyük gecikme sonrası sayaçları sıfırla
    if (duration >= 1 || this.bytesTransferred >= this.maxBytesPerSecond) {
      this.bytesTransferred = 0;
      this.lastCheck = now;
    }
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