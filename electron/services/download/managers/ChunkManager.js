const { createLogger } = require('../../../utils/logger');
const bandwidthManager = require('./BandwidthManager');
const path = require('path');
const fetch = require('node-fetch');

const logger = createLogger('chunk-manager');

class ChunkManager {
  constructor() {
    this.activeChunks = new Map();
    this.throttleInterval = 100; // 100ms kontrol aralığı
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

      // Throttling konfigürasyonu logla
      logger.info('[THROTTLE CONFIG]', {
        maxBytesPerInterval: `${(bandwidthManager.maxChunkSpeed * this.throttleInterval / 1000 / 1024).toFixed(2)}KB per ${this.throttleInterval}ms`,
        targetSpeed: `${(bandwidthManager.maxChunkSpeed / (1024 * 1024)).toFixed(2)}MB/s`
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        downloadedBytes += value.length;
        
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const currentSpeed = downloadedBytes / elapsed;

        // Her interval'da hız kontrolü
        logger.info('[THROTTLE INTERVAL]', {
          chunkId,
          currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
          downloadedBytes: `${(downloadedBytes / 1024).toFixed(2)}KB`,
          elapsed: `${elapsed.toFixed(2)}s`
        });

        // Hız limiti aşıldıysa log
        if (currentSpeed > bandwidthManager.maxChunkSpeed) {
          logger.warn('[THROTTLE LIMIT EXCEEDED]', {
            chunkId,
            currentSpeed: `${(currentSpeed / (1024 * 1024)).toFixed(2)}MB/s`,
            maxSpeed: `${(bandwidthManager.maxChunkSpeed / (1024 * 1024)).toFixed(2)}MB/s`
          });
        }

        bandwidthManager.updateProgress(downloadId, downloadedBytes);
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const averageSpeed = downloadedBytes / duration;

      // İndirme tamamlandığında özet log
      logger.info('[CHUNK COMPLETE]', {
        chunkId,
        size: `${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB`,
        duration: `${duration.toFixed(2)}s`,
        averageSpeed: `${(averageSpeed / (1024 * 1024)).toFixed(2)}MB/s`
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
        error: error.message,
        downloadedBytes: `${(downloadedBytes / 1024).toFixed(2)}KB`,
        elapsed: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
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