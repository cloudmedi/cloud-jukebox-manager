const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const retryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const bandwidthManager = require('./managers/BandwidthManager');
const memoryManager = require('./managers/MemoryManager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.MAX_RETRY_ATTEMPTS = 3;
  }

  setChunkSize(size) {
    if (typeof size !== 'number') return;
    
    this.CHUNK_SIZE = Math.min(
      Math.max(size, this.MIN_CHUNK_SIZE),
      this.MAX_CHUNK_SIZE
    );
    console.log(`Chunk size set to: ${this.CHUNK_SIZE / 1024}KB`);
  }

  async downloadChunk(url, start, end) {
    if (!url || typeof start !== 'number' || typeof end !== 'number') {
      throw new Error('Invalid parameters for downloadChunk');
    }

    const operation = async () => {
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
      const md5Checksum = response.headers['x-chunk-md5'] || '';

      if (md5Checksum && !(await ChecksumUtils.verifyChunkChecksum(chunk, md5Checksum))) {
        throw new Error('Chunk MD5 verification failed');
      }

      await bandwidthManager.throttleSpeed(chunk.length);
      return chunk;
    };

    return await retryManager.executeWithRetry(
      operation,
      `Chunk download: ${url} (${start}-${end})`
    );
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    if (!song || !song._id || !baseUrl || !playlistDir) {
      throw new Error('Invalid parameters for downloadSongInChunks');
    }

    const downloadTask = {
      songId: song._id,
      execute: async () => {
        try {
          console.log(`Starting chunked download for song: ${song.name}`);
          
          const songPath = path.join(playlistDir, `${song._id}.mp3`);
          const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

          // İlk chunk'ı indir
          const firstChunk = await this.downloadChunk(songUrl, 0, this.CHUNK_SIZE - 1);
          memoryManager.storeChunk(song._id, 0, firstChunk);
          fs.writeFileSync(songPath, Buffer.from(firstChunk));

          this.emit('firstChunkReady', {
            songId: song._id,
            songPath,
            buffer: firstChunk
          });

          // Dosya boyutunu ve SHA-256 checksumunu al
          const response = await axios.head(songUrl);
          const fileSize = parseInt(response.headers['content-length'], 10);
          const expectedSHA256 = response.headers['x-file-sha256'] || '';
          
          // Kalan chunk'ları indir
          for (let start = this.CHUNK_SIZE; start < fileSize; start += this.CHUNK_SIZE) {
            const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
            const chunk = await this.downloadChunk(songUrl, start, end);
            
            const chunkIndex = Math.floor(start / this.CHUNK_SIZE);
            memoryManager.storeChunk(song._id, chunkIndex, chunk);
            fs.appendFileSync(songPath, Buffer.from(chunk));

            const progress = Math.floor((start + chunk.length) / fileSize * 100);
            this.emit('progress', {
              songId: song._id,
              progress,
              isComplete: progress === 100
            });
          }

          // Dosya tamamlandığında SHA-256 kontrolü yap
          if (expectedSHA256) {
            const isValid = await ChecksumUtils.verifyFileChecksum(songPath, expectedSHA256);
            if (!isValid) {
              throw new Error('File SHA-256 verification failed');
            }
          }

          console.log(`Download completed for ${song.name}`);
          return songPath;

        } catch (error) {
          console.error(`Error in chunked download for ${song.name}:`, error);
          throw error;
        }
      }
    };

    return new Promise((resolve, reject) => {
      bandwidthManager.addToQueue({
        ...downloadTask,
        onComplete: resolve,
        onError: reject
      });
    });
  }
}

module.exports = new ChunkDownloadManager();