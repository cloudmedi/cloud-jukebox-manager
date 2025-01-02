const { createLogger } = require('../../../utils/logger');
const { exponentialBackoff } = require('../utils/backoff');

const logger = createLogger('retry-strategy');

class RetryStrategy {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 5;
    this.initialDelay = 1000;
    this.maxDelay = 30000;
  }

  shouldRetry(error, songId) {
    const attempts = this.retryAttempts.get(songId) || 0;
    
    if (attempts >= this.maxRetries) {
      logger.warn(`Max retries reached for song: ${songId}`);
      return false;
    }

    // Yeniden denenebilir hataları kontrol et
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'CHUNK_ERROR'
    ];

    const shouldRetry = retryableErrors.includes(error.code) || 
                       error.message.includes('timeout') ||
                       error.message.includes('network');

    if (!shouldRetry) {
      logger.info(`Non-retryable error for song: ${songId}`, { error: error.message });
    }

    return shouldRetry;
  }

  async getNextRetryDelay(songId) {
    const attempts = this.retryAttempts.get(songId) || 0;
    this.retryAttempts.set(songId, attempts + 1);

    const delay = exponentialBackoff(
      this.initialDelay,
      attempts,
      this.maxDelay
    );

    logger.info(`Retry delay calculated for song: ${songId}`, {
      attempts: attempts + 1,
      delay
    });

    return delay;
  }

  reset(songId) {
    this.retryAttempts.delete(songId);
    logger.info(`Reset retry attempts for song: ${songId}`);
  }

  getAttempts(songId) {
    return this.retryAttempts.get(songId) || 0;
  }
}

module.exports = new RetryStrategy();