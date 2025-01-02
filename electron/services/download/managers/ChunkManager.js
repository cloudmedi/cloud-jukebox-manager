const { EventEmitter } = require('events');
const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const ChecksumVerifier = require('../utils/ChecksumVerifier');

const logger = createLogger('chunk-manager');

class ChunkManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return this.MIN_CHUNK_SIZE;
    if (fileSize < 100 * 1024 * 1024) return this.DEFAULT_CHUNK_SIZE;
    return this.MAX_CHUNK_SIZE;
  }

  async downloadChunk(url, start, end, songId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000
      });

      const chunk = response.data;
      const chunkChecksum = await ChecksumVerifier.calculateMD5(chunk);
      
      if (!await ChecksumVerifier.verifyChunkChecksum(chunk, chunkChecksum)) {
        throw new Error('Chunk checksum verification failed');
      }

      return chunk;
    } catch (error) {
      logger.error(`Error downloading chunk ${chunkId}:`, error);
      throw error;
    }
  }
}

module.exports = new ChunkManager();