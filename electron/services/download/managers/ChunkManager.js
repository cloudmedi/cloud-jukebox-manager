const { createLogger } = require('../../../utils/logger');
const bandwidthManager = require('./BandwidthManager');

const logger = createLogger('chunk-manager');

class ChunkManager {
  constructor() {
    this.activeChunks = new Map();
  }

  async downloadChunk(url, start, end, songId, downloadId) {
    const chunkId = `${songId}-${start}`;
    logger.info('[CHUNK START]', {
      chunkId,
      start,
      end,
      size: end - start
    });

    const startTime = Date.now();
    let downloadedBytes = 0;

    try {
      const response = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` }
      });

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        downloadedBytes += value.length;
        
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const speed = downloadedBytes / elapsed;

        logger.info('[CHUNK DOWNLOAD]', {
          chunkId,
          speed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`,
          progress: `${((downloadedBytes / (end - start)) * 100).toFixed(1)}%`
        });

        bandwidthManager.updateProgress(downloadId, downloadedBytes);
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const averageSpeed = downloadedBytes / duration;

      logger.info('[CHUNK COMPLETE]', {
        chunkId,
        size: `${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB`,
        duration: `${duration.toFixed(2)}s`,
        speed: `${(averageSpeed / (1024 * 1024)).toFixed(2)}MB/s`
      });

      const concatenated = new Uint8Array(downloadedBytes);
      let position = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, position);
        position += chunk.length;
      }

      return concatenated.buffer;
    } catch (error) {
      logger.error('[CHUNK ERROR]', {
        chunkId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ChunkManager();