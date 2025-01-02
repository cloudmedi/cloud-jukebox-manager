const { createLogger } = require('../../../utils/logger');

const logger = createLogger('network-error-handler');

class NetworkErrorHandler {
  static isRetryableError(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'CHUNK_DOWNLOAD_ERROR',
      'CHECKSUM_VERIFICATION_FAILED'
    ];

    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

    const isRetryable = (
      retryableErrors.includes(error.code) ||
      (error.response && retryableStatusCodes.includes(error.response.status)) ||
      error.message.includes('timeout') ||
      error.message.includes('network error')
    );

    logger.debug('Error retry check:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      isRetryable
    });

    return isRetryable;
  }

  static getRetryDelay(attempt, baseDelay = 1000) {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    const maxDelay = 30000; // Maximum 30 seconds
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    logger.debug('Calculated retry delay:', {
      attempt,
      baseDelay,
      exponentialDelay,
      jitter,
      finalDelay: delay
    });
    
    return delay;
  }

  static async handleWithRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error;
        logger.error(`Attempt ${attempt} failed:`, error);
        
        if (!this.isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }
        
        const delay = this.getRetryDelay(attempt);
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

module.exports = NetworkErrorHandler;