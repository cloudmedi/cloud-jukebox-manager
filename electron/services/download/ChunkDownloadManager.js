const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const RetryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const DownloadQueue = require('./DownloadQueue');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.retryManager = new RetryManager();
    this.downloadQueue = new DownloadQueue();
    this.setupRetryListener();
    
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.MAX_CONCURRENT_DOWNLOADS = 3;
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB max memory
    this.MAX_RETRY_ATTEMPTS = 3;
    this.activeDownloads = new Map();
    this.chunkBuffers = new Map();
    this.downloadedChunks = new Map();
    this.memoryUsage = 0;
  }

  setupRetryListener() {
    this.retryManager.on('retry', ({ attempt, maxAttempts, error, context }) => {
      console.log(`Retry attempt ${attempt}/${maxAttempts} for ${context}: ${error}`);
      this.emit('downloadRetry', {
        attempt,
        maxAttempts,
        error,
        context
      });
    });
  }

  async downloadChunk(url, start, end) {
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
      const md5Checksum = response.headers['x-chunk-md5'];

      if (md5Checksum) {
        const isValid = await ChecksumUtils.verifyChunkChecksum(chunk, md5Checksum);
        if (!isValid) {
          throw new Error('Chunk MD5 verification failed');
        }
      }

      return chunk;
    };

    return await this.retryManager.executeWithRetry(
      operation,
      `Chunk download: ${url} (${start}-${end})`
    );
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // İlk chunk'ı indir
      const firstChunkSize = this.CHUNK_SIZE;
      const firstChunk = await this.downloadChunk(songUrl, 0, firstChunkSize - 1);

      this.trackMemoryUsage(firstChunk.length, 'add');
      if (!this.downloadedChunks.has(song._id)) {
        this.downloadedChunks.set(song._id, []);
      }
      this.downloadedChunks.get(song._id).push(firstChunk);

      fs.writeFileSync(songPath, Buffer.from(firstChunk));
      
      this.emit('firstChunkReady', {
        songId: song._id,
        songPath,
        buffer: firstChunk
      });

      // Dosya boyutunu ve SHA-256 checksumunu al
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const expectedSHA256 = response.headers['x-file-sha256'];
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);
      
      this.activeDownloads.set(song._id, {
        isActive: true,
        lastActive: Date.now(),
        totalChunks,
        progress: 0
      });
      
      // Kalan chunk'ları indir
      for (let start = firstChunkSize; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end);
        
        this.trackMemoryUsage(chunk.length, 'add');
        this.downloadedChunks.get(song._id).push(chunk);
        
        fs.appendFileSync(songPath, Buffer.from(chunk));

        const download = this.activeDownloads.get(song._id);
        if (download) {
          download.lastActive = Date.now();
          download.progress = Math.floor((start + chunk.length) / fileSize * 100);
        }

        this.emit('progress', {
          songId: song._id,
          progress: download.progress,
          isComplete: download.progress === 100
        });
      }

      // Dosya tamamlandığında SHA-256 kontrolü yap
      if (expectedSHA256) {
        const isValid = await ChecksumUtils.verifyFileChecksum(songPath, expectedSHA256);
        if (!isValid) {
          throw new Error('File SHA-256 verification failed');
        }
      }

      const download = this.activeDownloads.get(song._id);
      if (download) {
        download.isActive = false;
        download.progress = 100;
      }

      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      throw error;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    console.log(`Adding song to queue: ${song.name}`);
    this.downloadQueue.add({
      song,
      baseUrl,
      playlistDir
    });
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.isEmpty()) {
      console.log('Download queue is empty');
      return;
    }

    while (
      this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && 
      !this.downloadQueue.isEmpty()
    ) {
      const download = this.downloadQueue.next();
      if (download) {
        console.log(`Processing download for: ${download.song.name}`);
        this.activeDownloads.set(download.song._id, {
          isActive: true,
          lastActive: Date.now(),
          progress: 0
        });
        
        try {
          await this.downloadSongInChunks(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
          console.log(`Download completed for: ${download.song.name}`);
        } catch (error) {
          console.error(`Download failed for: ${download.song.name}`, error);
        } finally {
          this.activeDownloads.delete(download.song._id);
          this.processQueue();
        }
      }
    }
  }
}

module.exports = new ChunkDownloadManager();