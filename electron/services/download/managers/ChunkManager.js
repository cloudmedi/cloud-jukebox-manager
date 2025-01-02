const { createLogger } = require('../../../utils/logger');
const bandwidthManager = require('./BandwidthManager');

const logger = createLogger('chunk-manager');

class ChunkManager {
  constructor() {
    this.activeChunks = new Map();
    this.throttleInterval = 100; // 100ms kontrol aralığı
  }

  async throttleTransfer(reader, downloadId, chunkSize) {
    const maxBytesPerInterval = (bandwidthManager.maxChunkSpeed * this.throttleInterval) / 1000;
    let bytesInInterval = 0;
    let lastIntervalStart = Date.now();
    let totalBytesProcessed = 0;
    let throttleCount = 0;

    logger.info('[THROTTLE CONFIG]', {
      maxBytesPerInterval: `${(maxBytesPerInterval / 1024).toFixed(2)}KB per ${this.throttleInterval}ms`,
      targetSpeed: `${(bandwidthManager.maxChunkSpeed / (1024 * 1024)).toFixed(2)}MB/s`
    });

    return new Promise((resolve, reject) => {
      const processChunk = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            logger.info('[THROTTLE SUMMARY]', {
              totalBytesProcessed: `${(totalBytesProcessed / (1024 * 1024)).toFixed(2)}MB`,
              throttleCount,
              averageSpeed: `${((totalBytesProcessed / 1024 / 1024) / (Date.now() - lastIntervalStart) * 1000).toFixed(2)}MB/s`
            });
            resolve();
            return;
          }

          bytesInInterval += value.length;
          totalBytesProcessed += value.length;
          const now = Date.now();
          const intervalElapsed = now - lastIntervalStart;

          if (intervalElapsed >= this.throttleInterval) {
            const currentSpeed = (bytesInInterval * 1000) / intervalElapsed;
            
            logger.info('[THROTTLE INTERVAL]', {
              currentBytes: `${(bytesInInterval / 1024).toFixed(2)}KB`,
              elapsed: `${intervalElapsed}ms`,
              currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`
            });

            if (currentSpeed > bandwidthManager.maxChunkSpeed) {
              throttleCount++;
              const delay = Math.ceil(
                (bytesInInterval - maxBytesPerInterval) * 1000 / bandwidthManager.maxChunkSpeed
              );
              
              logger.warn('[THROTTLE ACTIVE]', {
                currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
                maxSpeed: `${(bandwidthManager.maxChunkSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
                delay: `${delay}ms`,
                throttleCount
              });
              
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            bytesInInterval = 0;
            lastIntervalStart = Date.now();
          }

          processChunk();
        } catch (error) {
          logger.error('[THROTTLE ERROR]', {
            error: error.message,
            bytesProcessed: `${(totalBytesProcessed / (1024 * 1024)).toFixed(2)}MB`,
            throttleCount
          });
          reject(error);
        }
      };

      processChunk();
    });
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

      // Throttling işlemi başlat
      await this.throttleTransfer(reader, downloadId, end - start);

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

  calculateOptimalChunkSize(fileSize) {
    // Dosya boyutuna göre optimal chunk boyutu hesapla
    if (fileSize < 10 * 1024 * 1024) { // 10MB'dan küçük
      return 256 * 1024; // 256KB chunks
    } else if (fileSize < 100 * 1024 * 1024) { // 100MB'dan küçük
      return 512 * 1024; // 512KB chunks
    } else {
      return 1024 * 1024; // 1MB chunks
    }
  }
}

module.exports = new ChunkManager();