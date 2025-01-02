const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const TimeoutManager = require('./utils/TimeoutManager');
const NetworkErrorHandler = require('./utils/NetworkErrorHandler');
const ChecksumVerifier = require('./utils/ChecksumVerifier');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.timeoutManager = new TimeoutManager();
    this.isProcessing = false;
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return this.MIN_CHUNK_SIZE;
    if (fileSize < 100 * 1024 * 1024) return this.DEFAULT_CHUNK_SIZE;
    return this.MAX_CHUNK_SIZE;
  }

  async downloadChunk(url, start, end, songId) {
    const chunkId = `${songId}-${start}`;
    let clearChunkTimeout;

    try {
      clearChunkTimeout = this.timeoutManager.setChunkTimeout(chunkId, (error) => {
        throw error;
      });

      const response = await NetworkErrorHandler.handleWithRetry(async () => {
        return await axios({
          url,
          method: 'GET',
          responseType: 'arraybuffer',
          headers: { Range: `bytes=${start}-${end}` }
        });
      });

      const chunk = response.data;
      const chunkChecksum = ChecksumVerifier.calculateChunkChecksum(chunk);
      
      if (!await ChecksumVerifier.verifyChunkChecksum(chunk, chunkChecksum)) {
        throw new Error('Chunk checksum verification failed');
      }

      return chunk;

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
      
      const clearGlobalTimeout = this.timeoutManager.setGlobalTimeout((error) => {
        writer.end();
        throw error;
      });

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