const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const TimeoutManager = require('./utils/TimeoutManager');
const NetworkErrorHandler = require('./utils/NetworkErrorHandler');
const ChecksumVerifier = require('./utils/ChecksumVerifier');
const { createLogger } = require('../../utils/logger');
const bandwidthManager = require('./BandwidthManager');
const throttle = require('lodash/throttle');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 5000; // 5 seconds
    
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = bandwidthManager.maxConcurrentDownloads;
    this.timeoutManager = new TimeoutManager();
    this.isProcessing = false;

    logger.info('ChunkDownloadManager initialized with:', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      minChunkSize: `${this.MIN_CHUNK_SIZE / 1024}KB`,
      maxChunkSize: `${this.MAX_CHUNK_SIZE / (1024 * 1024)}MB`,
      defaultChunkSize: `${this.DEFAULT_CHUNK_SIZE / 1024}KB`,
      maxRetries: this.MAX_RETRIES,
      retryDelay: `${this.RETRY_DELAY / 1000}s`
    });
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return this.MIN_CHUNK_SIZE;
    if (fileSize < 100 * 1024 * 1024) return this.DEFAULT_CHUNK_SIZE;
    return this.MAX_CHUNK_SIZE;
  }

  async downloadChunk(url, start, end, songId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    let clearChunkTimeout;
    const chunkSize = end - start + 1;

    logger.info(`Starting chunk download:`, {
      chunkId,
      size: `${chunkSize / 1024}KB`,
      retryCount,
      maxSpeed: `${bandwidthManager.getThrottleSpeed() / (1024 * 1024)}MB/s`,
      priority: bandwidthManager.downloadPriority
    });

    try {
      clearChunkTimeout = this.timeoutManager.setChunkTimeout(chunkId);

      let lastLogged = Date.now();
      let lastBytes = 0;

      const throttledProgress = throttle((loaded) => {
        const now = Date.now();
        const timeDiff = (now - lastLogged) / 1000; // seconds
        const bytesDiff = loaded - lastBytes;
        const speed = bytesDiff / timeDiff; // bytes per second

        logger.debug(`Chunk download progress:`, {
          chunkId,
          loaded: `${loaded / 1024}KB`,
          total: `${chunkSize / 1024}KB`,
          speed: `${speed / (1024 * 1024)}MB/s`,
          progress: `${Math.round((loaded / chunkSize) * 100)}%`
        });

        lastLogged = now;
        lastBytes = loaded;
      }, 1000);

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { 
          Range: `bytes=${start}-${end}`,
          Priority: bandwidthManager.downloadPriority
        },
        onDownloadProgress: (progressEvent) => {
          throttledProgress(progressEvent.loaded);
        },
        maxRate: bandwidthManager.getThrottleSpeed()
      });

      const chunk = response.data;
      const chunkChecksum = ChecksumVerifier.calculateMD5(chunk);
      
      logger.info(`Chunk download completed:`, {
        chunkId,
        size: `${chunk.length / 1024}KB`,
        checksum: chunkChecksum
      });

      if (!await ChecksumVerifier.verifyChunkChecksum(chunk, chunkChecksum)) {
        throw new Error('Chunk checksum verification failed');
      }

      return chunk;

    } catch (error) {
      logger.error(`Chunk download failed:`, {
        chunkId,
        error: error.message,
        retryCount,
        willRetry: retryCount < this.MAX_RETRIES && NetworkErrorHandler.isRetryableError(error)
      });

      if (retryCount < this.MAX_RETRIES && NetworkErrorHandler.isRetryableError(error)) {
        logger.warn(`Retrying chunk download (${retryCount + 1}/${this.MAX_RETRIES}): ${chunkId}`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.downloadChunk(url, start, end, songId, retryCount + 1);
      }
      throw error;
    } finally {
      if (clearChunkTimeout) {
        clearChunkTimeout();
      }
    }
  }

  async downloadSong(song, baseUrl, playlistDir) {
    logger.info(`Starting download for song: ${song.name}`);
    
    try {
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const tempSongPath = `${songPath}.temp`;
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      
      // Resume kontrolü
      let startByte = 0;
      if (fs.existsSync(tempSongPath)) {
        const stats = fs.statSync(tempSongPath);
        startByte = stats.size;
        logger.info(`Resuming download from byte ${startByte}`);
      }

      const chunks = Math.ceil((fileSize - startByte) / chunkSize);
      const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });
      
      const clearGlobalTimeout = this.timeoutManager.setGlobalTimeout();

      try {
        for (let i = 0; i < chunks; i++) {
          const start = startByte + (i * chunkSize);
          const end = Math.min(start + chunkSize - 1, fileSize - 1);
          
          const chunk = await this.downloadChunk(songUrl, start, end, song._id);
          writer.write(chunk);

          const progress = Math.round(((i + 1) / chunks) * 100);
          this.emit('progress', { 
            songId: song._id, 
            progress,
            downloadedSize: start + chunk.length,
            totalSize: fileSize,
            currentChunk: i + 1,
            totalChunks: chunks
          });
        }

        await new Promise((resolve) => writer.end(resolve));
        
        // Final checksum verification
        if (song.checksum) {
          const isValid = await ChecksumVerifier.verifyFileChecksum(tempSongPath, song.checksum);
          if (!isValid) {
            throw new Error('Final checksum verification failed');
          }
        }

        fs.renameSync(tempSongPath, songPath);
        logger.info(`Download completed for ${song.name}`);
        return songPath;

      } finally {
        clearGlobalTimeout();
        this.timeoutManager.clearAll();
      }

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir) {
    logger.info(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return;
    }

    this.isProcessing = true;

    try {
      while (
        this.downloadQueue.length > 0 && 
        this.activeDownloads.size < this.maxConcurrentDownloads
      ) {
        const download = this.downloadQueue.shift();
        if (download) {
          const { song, baseUrl, playlistDir } = download;
          this.activeDownloads.set(song._id, download);
          
          try {
            await this.downloadSong(song, baseUrl, playlistDir);
            this.emit('songDownloaded', song._id);
          } finally {
            this.activeDownloads.delete(song._id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  clearDownload(songId) {
    this.activeDownloads.delete(songId);
    this.downloadQueue = this.downloadQueue.filter(item => item.song._id !== songId);
    this.timeoutManager.clearAll();
  }
}

module.exports = new ChunkDownloadManager();