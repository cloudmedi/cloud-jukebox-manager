const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const ThrottleController = require('../utils/ThrottleController');

class ChunkManager {
  constructor() {
    this.logger = createLogger('chunk-manager');
    this.throttleController = new ThrottleController(2 * 1024 * 1024); // 2MB/s
    this.activeDownloads = new Map();
  }

  async downloadChunk(url, start, end, songId, downloadId) {
    const chunkId = `${songId}-${start}`;
    
    try {
      // Throttling kontrolü
      await this.throttleController.acquireToken(end - start);

      const startTime = Date.now();
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        onDownloadProgress: async (progressEvent) => {
          const bytesDownloaded = progressEvent.loaded;
          await this.throttleController.updateProgress(downloadId, bytesDownloaded);
        }
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const speed = response.data.length / duration;

      this.logger.info(`Chunk download completed:`, {
        chunkId,
        size: response.data.length,
        duration,
        speed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Chunk download error:`, {
        chunkId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ChunkManager();