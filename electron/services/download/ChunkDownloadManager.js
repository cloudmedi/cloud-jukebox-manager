const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const retryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const bandwidthManager = require('./utils/bandwidthManager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB max memory
    this.MAX_RETRY_ATTEMPTS = 3;
    this.chunkBuffers = new Map();
    this.downloadedChunks = new Map();
    this.memoryUsage = 0;

    // Düşük öncelikli indirme
    bandwidthManager.setPriority();
    
    setInterval(() => this.cleanupMemory(), 30000);
  }

  setChunkSize(size) {
    // Chunk boyutunu sınırlar içinde tut
    this.CHUNK_SIZE = Math.min(
      Math.max(size, this.MIN_CHUNK_SIZE),
      this.MAX_CHUNK_SIZE
    );
    console.log(`Chunk size set to: ${this.CHUNK_SIZE / 1024}KB`);
  }

  getMemoryUsage() {
    return this.memoryUsage;
  }

  trackMemoryUsage(size, operation = 'add') {
    if (operation === 'add') {
      this.memoryUsage += size;
    } else {
      this.memoryUsage -= size;
    }
    
    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      console.warn('High memory usage detected:', this.memoryUsage);
      this.emit('high-memory-usage', this.memoryUsage);
      this.cleanupMemory(true); // Force cleanup
    }
  }

  cleanupMemory(force = false) {
    console.log('Running memory cleanup...');
    
    for (const [songId, chunks] of this.downloadedChunks.entries()) {
      if (force || this.isDownloadComplete(songId)) {
        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        this.trackMemoryUsage(totalSize, 'subtract');
        this.downloadedChunks.delete(songId);
        this.chunkBuffers.delete(songId);
        console.log(`Cleaned up chunks for song: ${songId}`);
      }
    }

    for (const [songId, download] of this.activeDownloads.entries()) {
      if (!download.isActive && (force || Date.now() - download.lastActive > 300000)) {
        this.activeDownloads.delete(songId);
        console.log(`Cleaned up inactive download: ${songId}`);
      }
    }
  }

  isDownloadComplete(songId) {
    const chunks = this.downloadedChunks.get(songId);
    if (!chunks) return false;
    
    const download = this.activeDownloads.get(songId);
    if (!download) return true;
    
    return download.totalChunks === chunks.length;
  }

  async downloadChunk(url, start, end) {
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

        // Hız sınırlaması uygula
        await bandwidthManager.throttleSpeed(chunk);

        // MD5 kontrolü
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

      // Eşzamanlı indirme limiti kontrolü
      if (!bandwidthManager.canStartNewDownload()) {
        console.log(`Adding ${song.name} to download queue`);
        bandwidthManager.addToQueue({ song, baseUrl, playlistDir });
        return;
      }

      bandwidthManager.trackDownload(song._id, { isActive: true });

      // İlk chunk'ı indir
      const firstChunkSize = this.CHUNK_SIZE;
      const firstChunkOperation = async () => {
        const response = await axios({
          url: songUrl,
          method: 'GET',
          responseType: 'arraybuffer',
          headers: {
            Range: `bytes=0-${firstChunkSize - 1}`
          }
        });
        return response.data;
      };

      const firstChunkResponse = await retryManager.executeWithRetry(
        firstChunkOperation,
        `First chunk download: ${song.name}`
      );

      this.trackMemoryUsage(firstChunkResponse.length, 'add');
      if (!this.downloadedChunks.has(song._id)) {
        this.downloadedChunks.set(song._id, []);
      }
      this.downloadedChunks.get(song._id).push(firstChunkResponse);

      fs.writeFileSync(songPath, Buffer.from(firstChunkResponse));
      
      this.emit('firstChunkReady', {
        songId: song._id,
        songPath,
        buffer: firstChunkResponse
      });

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
          
          this.trackMemoryUsage(chunk.length, 'add');
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

      // SHA-256 kontrolü
      if (expectedSHA256) {
        const isValid = await ChecksumUtils.verifyFileChecksum(songPath, expectedSHA256);
        if (!isValid) {
          throw new Error('File SHA-256 verification failed');
        }
      }

      bandwidthManager.removeDownload(song._id);

      // Sıradaki indirmeyi başlat
      const nextDownload = bandwidthManager.getNextDownload();
      if (nextDownload) {
        this.downloadSongInChunks(
          nextDownload.song,
          nextDownload.baseUrl,
          nextDownload.playlistDir
        );
      }

      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      bandwidthManager.removeDownload(song._id);
      throw error;
    }
  }
}

module.exports = new ChunkDownloadManager();
