const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const { calculateChunkSize } = require('../utils/chunkUtils');

class ChunkManager {
  constructor() {
    this.logger = createLogger('chunk-manager');
  }

  async downloadChunk(url, start, end, onProgress) {
    this.logger.info(`Downloading chunk: ${start}-${end}`);
    
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: { Range: `bytes=${start}-${end}` },
      onDownloadProgress: onProgress
    });

    return response.data;
  }

  calculateChunks(fileSize, preferredChunkSize = 1024 * 1024) {
    const chunkSize = calculateChunkSize(fileSize);
    const chunks = [];
    
    for (let start = 0; start < fileSize; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, fileSize - 1);
      chunks.push({ start, end });
    }

    return chunks;
  }

  async getFileSize(url) {
    const { headers } = await axios.head(url);
    return parseInt(headers['content-length'], 10);
  }
}

module.exports = ChunkManager;