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
      error.message.includes('chunk failed')
    );

    logger.debug('Error retry check:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      isRetryable
    });

    return isRetryable;
  }
}

module.exports = NetworkErrorHandler;