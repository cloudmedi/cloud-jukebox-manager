const axios = require('axios');
const checksumManager = require('./ChecksumManager');
const retryManager = require('./RetryManager');
const chunkSizeManager = require('./ChunkSizeManager');

class DownloadWorker {
  constructor() {
    this.activeDownloads = new Map();
  }

  async downloadChunk(url, start, end) {
    const startTime = Date.now();
    
    const operation = async () => {
      try {
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'arraybuffer',
          headers: {
            Range: `bytes=${start}-${end}`
          },
          timeout: 30000
        });

        const chunk = response.data;
        const checksum = checksumManager.calculateChunkChecksum(chunk);
        
        // Verify chunk integrity
        if (!await checksumManager.verifyChunk(chunk, checksum)) {
          throw new Error('Chunk verification failed');
        }

        const endTime = Date.now();
        const timeElapsed = endTime - startTime;
        
        chunkSizeManager.adjustChunkSize(chunk.length, timeElapsed);

        return {
          data: chunk,
          checksum
        };
      } catch (error) {
        error.code = 'CHUNK_DOWNLOAD_ERROR';
        throw error;
      }
    };

    return await retryManager.executeWithRetry(
      operation,
      `Chunk download: ${url} (${start}-${end})`
    );
  }

  isActive(downloadId) {
    return this.activeDownloads.has(downloadId);
  }

  setActive(downloadId, isActive) {
    if (isActive) {
      this.activeDownloads.set(downloadId, Date.now());
    } else {
      this.activeDownloads.delete(downloadId);
    }
  }
}

module.exports = new DownloadWorker();