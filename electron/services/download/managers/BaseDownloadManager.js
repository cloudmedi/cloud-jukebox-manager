const { EventEmitter } = require('events');
const { createLogger } = require('../../../utils/logger');

class BaseDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.logger = createLogger('base-download-manager');
  }

  async validateDownload(url, headers) {
    try {
      const response = await axios.head(url);
      return {
        fileSize: parseInt(response.headers['content-length'], 10),
        contentType: response.headers['content-type']
      };
    } catch (error) {
      this.logger.error('Download validation error:', error);
      throw error;
    }
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB
    if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB
    return 2 * 1024 * 1024; // 2MB
  }
}

module.exports = BaseDownloadManager;