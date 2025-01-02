const { createLogger } = require('../../../utils/logger');
const logger = createLogger('network-error-handler');

class NetworkErrorHandler {
  static RETRY_DELAY = 5000; // 5 saniye
  static MAX_RETRIES = 3;

  static isRetryableError(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'CHUNK_DOWNLOAD_ERROR'
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

  static async handleWithRetry(operation, maxRetries = this.MAX_RETRIES) {
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
        
        logger.info(`Waiting ${this.RETRY_DELAY}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    throw lastError;
  }
}

module.exports = NetworkErrorHandler;