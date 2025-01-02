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
      'EPIPE',
      'ENOTFOUND'
    ];

    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

    const isRetryable = (
      retryableErrors.includes(error.code) ||
      (error.response && retryableStatusCodes.includes(error.response.status)) ||
      error.message.includes('timeout') ||
      error.message.includes('network error') ||
      error.message.includes('checksum verification failed')
    );

    logger.debug('Error retry check:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      isRetryable
    });

    return isRetryable;
  }

  static async handleNetworkError(error, retryOperation, context, maxRetries = 3) {
    if (!this.isRetryableError(error) || context.retryCount >= maxRetries) {
      throw error;
    }

    const delay = Math.pow(2, context.retryCount) * 1000; // Exponential backoff
    logger.info(`Retrying operation in ${delay}ms (attempt ${context.retryCount + 1}/${maxRetries})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryOperation();
  }
}

module.exports = NetworkErrorHandler;