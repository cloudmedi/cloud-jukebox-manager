const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const retryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const BandwidthManager = require('./managers/BandwidthManager');
const MemoryManager = require('./managers/MemoryManager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.MAX_RETRY_ATTEMPTS = 3;
    this.downloadedChunks = new Map();
    this.chunkBuffers = new Map();

    // Düşük öncelikli indirme için process.priority ayarı
    if (process.platform !== 'win32') {
      process.nice(19); // Linux/Unix için düşük öncelik
    }

    MemoryManager.addCleanupCallback(() => this.cleanupMemory(true));
  }

  setChunkSize(size) {
    this.CHUNK_SIZE = Math.min(
      Math.max(size, this.MIN_CHUNK_SIZE),
      this.MAX_CHUNK_SIZE
    );
    console.log(`Chunk size set to: ${this.CHUNK_SIZE / 1024}KB`);
  }

  cleanupMemory(force = false) {
    console.log('Running memory cleanup...');
    
    for (const [songId, chunks] of this.downloadedChunks.entries()) {
      if (force || this.isDownloadComplete(songId)) {
        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        MemoryManager.trackMemoryUsage(totalSize, 'subtract');
        this.downloadedChunks.delete(songId);
        this.chunkBuffers.delete(songId);
        console.log(`Cleaned up chunks for song: ${songId}`);
      }
    }
  }

  isDownloadComplete(songId) {
    const chunks = this.downloadedChunks.get(songId);
    if (!chunks) return false;
    
    const download = BandwidthManager.activeDownloads.get(songId);
    if (!download) return true;
    
    return chunks.length === download.totalChunks;
  }

  async downloadChunk(url, start, end, songId) {
    if (!BandwidthManager.updateDownloadProgress(songId, start)) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Hız sınırı aşıldığında bekle
    }

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

    return retryManager.executeWithRetry(
      operation,
      `Chunk download: ${url} (${start}-${end})`
    );
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // Bant genişliği kontrolü
      if (!BandwidthManager.addDownload(song._id, { songPath, songUrl })) {
        console.log(`Song ${song.name} queued for download`);
        return new Promise((resolve) => {
          const checkQueue = setInterval(() => {
            if (BandwidthManager.addDownload(song._id, { songPath, songUrl })) {
              clearInterval(checkQueue);
              this.downloadSongInChunks(song, baseUrl, playlistDir).then(resolve);
            }
          }, 1000);
        });
      }

      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const expectedSHA256 = response.headers['x-file-sha256'] || '';
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);

      this.downloadedChunks.set(song._id, []);

      for (let start = 0; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        try {
          const chunk = await this.downloadChunk(songUrl, start, end, song._id);
          
          MemoryManager.trackMemoryUsage(chunk.length, 'add');
          this.downloadedChunks.get(song._id).push(chunk);
          
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

      BandwidthManager.completeDownload(song._id);
      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      BandwidthManager.completeDownload(song._id);
      throw error;
    }
  }
}

module.exports = new ChunkDownloadManager();