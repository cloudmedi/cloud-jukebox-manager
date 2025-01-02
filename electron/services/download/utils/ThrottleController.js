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
  }

  async throttle(bytes) {
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
        logger.debug(`[THROTTLE] Throttling download, waiting ${requiredDelay}ms, current speed: ${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`);
        await new Promise(resolve => setTimeout(resolve, requiredDelay));
        this.paused = false;
        
        // Reset after throttling
        this.bytesTransferred = 0;
        this.lastCheck = Date.now();
      }
    }

    // Her saniye başında sayaçları sıfırla
    if (duration >= 1) {
      this.bytesTransferred = 0;
      this.lastCheck = now;
    }
  }

  isPaused() {
    return this.paused;
  }

  setMaxSpeed(maxBytesPerSecond) {
    this.maxBytesPerSecond = maxBytesPerSecond;
    logger.info(`[THROTTLE] Max speed updated to ${maxBytesPerSecond / (1024 * 1024)}MB/s`);
  }
}

module.exports = ThrottleController;