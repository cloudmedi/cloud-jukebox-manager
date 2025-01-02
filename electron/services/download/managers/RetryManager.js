const { createLogger } = require('../../../utils/logger');
const NetworkErrorHandler = require('../utils/NetworkErrorHandler');

const logger = createLogger('retry-manager');

class RetryManager {
  constructor() {
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 5000; // 5 saniye
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
        
        if (retryCount === this.MAX_RETRIES || !NetworkErrorHandler.isRetryableError(error)) {
          logger.error(`Max retries reached or non-retryable error for ${context}:`, error);
          throw error;
        }

        logger.warn(`Retry ${retryCount}/${this.MAX_RETRIES} for ${context}`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }

    throw lastError;
  }
}

module.exports = new RetryManager();