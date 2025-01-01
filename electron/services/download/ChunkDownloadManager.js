const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const retryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const ChunkMemoryManager = require('./ChunkMemoryManager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024;
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024;
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024;
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.MAX_CONCURRENT_DOWNLOADS = 3;
    this.MAX_RETRY_ATTEMPTS = 3;
    this.activeDownloads = new Map();
    this.downloadQueue = [];

    setInterval(() => ChunkMemoryManager.cleanupMemory(), 30000);
  }

  setChunkSize(size) {
    this.CHUNK_SIZE = Math.min(
      Math.max(size, this.MIN_CHUNK_SIZE),
      this.MAX_CHUNK_SIZE
    );
    console.log(`Chunk size set to: ${this.CHUNK_SIZE / 1024}KB`);
  }

  async downloadChunk(url, start, end) {
    const operation = async () => {
      try {
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'arraybuffer',
          headers: {
            Range: `bytes=${start}-${end}`,
            'Priority': 'low'
          },
          timeout: 30000,
          maxRate: 2 * 1024 * 1024 // 2MB/s
        });

        const chunk = response.data;
        const md5Checksum = response.headers['x-chunk-md5'] || '';

        if (md5Checksum && !(await ChecksumUtils.verifyChunkChecksum(chunk, md5Checksum))) {
          throw new Error('Chunk MD5 verification failed');
        }

        return chunk;
      } catch (error) {
        error.code = 'CHUNK_DOWNLOAD_ERROR';
        throw error;
      }
    };

    let attempts = 0;
    while (attempts < this.MAX_RETRY_ATTEMPTS) {
      try {
        return await retryManager.executeWithRetry(
          operation,
          `Chunk download: ${url} (${start}-${end})`
        );
      } catch (error) {
        attempts++;
        if (attempts === this.MAX_RETRY_ATTEMPTS) {
          throw error;
        }
        console.log(`Retrying chunk download, attempt ${attempts + 1}/${this.MAX_RETRY_ATTEMPTS}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      await ChunkMemoryManager.initializeChunkArray(song._id);

      // İlk chunk'ı indir
      const firstChunkSize = this.CHUNK_SIZE;
      const firstChunk = await this.downloadChunk(songUrl, 0, firstChunkSize - 1);
      
      await ChunkMemoryManager.addChunk(song._id, firstChunk);
      fs.writeFileSync(songPath, Buffer.from(firstChunk));

      // Dosya boyutunu ve SHA-256 checksumunu al
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const expectedSHA256 = response.headers['x-file-sha256'] || '';
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);

      this.activeDownloads.set(song._id, {
        isActive: true,
        lastActive: Date.now(),
        totalChunks
      });

      // Kalan chunk'ları indir
      for (let start = firstChunkSize; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        try {
          const chunk = await this.downloadChunk(songUrl, start, end);
          await ChunkMemoryManager.addChunk(song._id, chunk);
          fs.appendFileSync(songPath, Buffer.from(chunk));

          const progress = Math.floor((start + chunk.length) / fileSize * 100);
          this.emit('progress', {
            songId: song._id,
            progress,
            isComplete: progress === 100
          });

        } catch (error) {
          console.error(`Error downloading chunk for ${song.name}:`, error);
          throw error;
        }
      }

      if (expectedSHA256) {
        const isValid = await ChecksumUtils.verifyFileChecksum(songPath, expectedSHA256);
        if (!isValid) {
          throw new Error('File SHA-256 verification failed');
        }
      }

      const download = this.activeDownloads.get(song._id);
      if (download) {
        download.isActive = false;
      }

      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      throw error;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    this.downloadQueue.push({ song, baseUrl, playlistDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) return;

    while (
      this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && 
      this.downloadQueue.length > 0
    ) {
      const download = this.downloadQueue.shift();
      if (download) {
        try {
          await this.downloadSongInChunks(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
        } catch (error) {
          console.error(`Error processing download for ${download.song.name}:`, error);
        } finally {
          this.activeDownloads.delete(download.song._id);
          this.processQueue();
        }
      }
    }
  }
}

module.exports = new ChunkDownloadManager();