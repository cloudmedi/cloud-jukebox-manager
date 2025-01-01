class RetryManager {
  constructor() {
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 5000; // 5 seconds
  }

  async executeWithRetry(operation, context) {
    let retryCount = 0;
    
    while (retryCount < this.MAX_RETRIES) {
      try {
        return await operation();
      } catch (error) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} for ${context}`);
        
        // Sadece geçici hatalarda retry yap
        if (!this.isRetryableError(error) || retryCount === this.MAX_RETRIES) {
          throw error;
        }
        
        // Exponential backoff ile bekle
        await this.delay(this.RETRY_DELAY * retryCount);
      }
    }
  }

  isRetryableError(error) {
    // Retry yapılabilecek hata tipleri
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'CHUNK_DOWNLOAD_ERROR'
    ];

    return retryableErrors.includes(error.code) || 
           error.message.includes('timeout') ||
           error.message.includes('network error');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new RetryManager();