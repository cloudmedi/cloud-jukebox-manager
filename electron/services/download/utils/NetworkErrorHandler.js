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

    return (
      retryableErrors.includes(error.code) ||
      (error.response && retryableStatusCodes.includes(error.response.status)) ||
      error.message.includes('timeout') ||
      error.message.includes('network error')
    );
  }

  static getRetryDelay(attempt, baseDelay = 1000) {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    const maxDelay = 30000; // Maximum 30 seconds
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  static async handleWithRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }
        
        const delay = this.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

module.exports = NetworkErrorHandler;