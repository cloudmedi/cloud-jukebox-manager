const axios = require('axios');
const checksumManager = require('./ChecksumManager');
const retryManager = require('./RetryManager');

class DownloadWorker {
  constructor() {
    this.activeDownloads = new Map();
  }

  async downloadChunk(url, start, end, maxSpeed) {
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
          timeout: 30000,
          // Hız sınırlaması için özel axios yapılandırması
          onDownloadProgress: (progressEvent) => {
            const elapsedTime = Date.now() - startTime;
            const speed = progressEvent.loaded / (elapsedTime / 1000); // bytes/second
            
            if (speed > maxSpeed) {
              // Hız sınırını aşarsa küçük bir gecikme ekle
              const delay = (speed - maxSpeed) / maxSpeed * 100;
              return new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        });

        const chunk = response.data;
        const checksum = checksumManager.calculateChunkChecksum(chunk);
        
        // Chunk bütünlük kontrolü
        if (!await checksumManager.verifyChunk(chunk, checksum)) {
          throw new Error('Chunk verification failed');
        }

        const endTime = Date.now();
        const timeElapsed = endTime - startTime;

        return {
          data: chunk,
          checksum,
          speed: chunk.length / (timeElapsed / 1000) // bytes/second
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