const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('token-bucket');

class TokenBucket extends EventEmitter {
  constructor(capacity, fillRate) {
    super();
    this.capacity = capacity;
    this.fillRate = fillRate;
    this.tokens = capacity;
    this.lastFill = Date.now();
    this.paused = false;
  }

  fillBucket() {
    if (this.paused) return;

    const now = Date.now();
    const timePassed = (now - this.lastFill) / 1000;
    const newTokens = timePassed * this.fillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastFill = now;

    logger.debug(`[BUCKET] Filled tokens:`, {
      newTokens: `${(newTokens / (1024 * 1024)).toFixed(2)}MB`,
      currentTokens: `${(this.tokens / (1024 * 1024)).toFixed(2)}MB`,
      capacity: `${(this.capacity / (1024 * 1024)).toFixed(2)}MB`
    });
  }

  async consumeTokens(tokens) {
    while (this.tokens < tokens) {
      this.fillBucket();
      if (this.tokens < tokens) {
        const waitTime = ((tokens - this.tokens) / this.fillRate) * 1000;
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
      }
    }
    
    this.tokens -= tokens;
    logger.debug(`[BUCKET] Consumed tokens:`, {
      consumed: `${(tokens / (1024 * 1024)).toFixed(2)}MB`,
      remaining: `${(this.tokens / (1024 * 1024)).toFixed(2)}MB`
    });
  }

  pause() {
    this.paused = true;
    logger.info('[BUCKET] Throttling paused');
  }

  resume() {
    this.paused = false;
    this.lastFill = Date.now();
    logger.info('[BUCKET] Throttling resumed');
  }
}

module.exports = TokenBucket;