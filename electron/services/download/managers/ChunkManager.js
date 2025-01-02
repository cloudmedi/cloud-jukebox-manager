const { EventEmitter } = require('events');
const axios = require('axios');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('chunk-manager');

const CHUNK_SIZE = 1024 * 1024; // 1MB

class ChunkManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
  }

  async downloadChunk(url, start, end, songId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    
    try {
      if (this.activeDownloads.get(chunkId)) {
        throw new Error('Chunk download already in progress');
      }
      
      this.activeDownloads.set(chunkId, true);
      logger.debug(`Starting chunk download: ${chunkId}`);

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000
      });

      const chunk = Buffer.from(response.data);
      this.activeDownloads.delete(chunkId);
      
      return chunk;

    } catch (error) {
      this.activeDownloads.delete(chunkId);
      
      if (retryCount < 3) {
        logger.warn(`Retrying chunk download: ${chunkId}`);
        return this.downloadChunk(url, start, end, songId, retryCount + 1);
      }

      throw error;
    }
  }

  calculateChunks(fileSize) {
    const chunks = [];
    let position = 0;

    while (position < fileSize) {
      const end = Math.min(position + CHUNK_SIZE - 1, fileSize - 1);
      chunks.push({ start: position, end });
      position = end + 1;
    }

    return chunks;
  }

  isDownloading(chunkId) {
    return this.activeDownloads.has(chunkId);
  }
}

const chunkManager = new ChunkManager();
module.exports = { chunkManager };