const { EventEmitter } = require('events');

class RetryManager extends EventEmitter {
  constructor(maxRetries = 3, initialDelay = 1000) {
    super();
    this.MAX_RETRIES = maxRetries;
    this.INITIAL_DELAY = initialDelay;
  }

  async executeWithRetry(operation, context) {
    let retryCount = 0;
    let lastError;

    while (retryCount < this.MAX_RETRIES) {
      try {
        return await operation();
      } catch (error) {
        retryCount++;
        lastError = error;

        if (!this.isRetryableError(error) || retryCount === this.MAX_RETRIES) {
          throw error;
        }

        const delay = this.calculateDelay(retryCount);
        this.emit('retry', {
          attempt: retryCount,
          maxAttempts: this.MAX_RETRIES,
          error: error.message,
          context,
          nextAttemptIn: delay
        });

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  isRetryableError(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'CHUNK_DOWNLOAD_ERROR'
    ];

    return retryableErrors.includes(error.code) || 
           error.message.includes('timeout') ||
           error.message.includes('network error') ||
           error.message.includes('checksum verification failed');
  }

  calculateDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = this.INITIAL_DELAY * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryManager;