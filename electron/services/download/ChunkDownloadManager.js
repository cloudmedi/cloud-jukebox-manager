const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const TimeoutManager = require('./utils/TimeoutManager');
const NetworkErrorHandler = require('./utils/NetworkErrorHandler');
const ChecksumVerifier = require('./utils/ChecksumVerifier');
const downloadStateManager = require('./DownloadStateManager');
const { createLogger } = require('../../utils/logger');

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
    this.maxConcurrentDownloads = 3;
    this.timeoutManager = new TimeoutManager();
    this.isProcessing = false;
  }

  async downloadSong(song, baseUrl, playlistDir) {
    const tempSongPath = path.join(playlistDir, `${song._id}.mp3.temp`);
    const finalSongPath = path.join(playlistDir, `${song._id}.mp3`);

    // Eğer final dosya zaten varsa ve checksum doğruysa, tekrar indirmeye gerek yok
    if (fs.existsSync(finalSongPath)) {
      const isValid = await ChecksumVerifier.verifyFileChecksum(finalSongPath, song.checksum);
      if (isValid) {
        logger.info(`Song already exists and verified: ${song.name}`);
        return finalSongPath;
      }
      // Checksum hatalıysa dosyayı sil ve yeniden indir
      fs.unlinkSync(finalSongPath);
    }

    try {
      logger.info(`Starting download for song: ${song.name}`);
      
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      
      // Mevcut indirme durumunu kontrol et
      let startByte = 0;
      let downloadState = downloadStateManager.getDownloadState(song.playlistId, song._id);
      
      if (downloadState && fs.existsSync(tempSongPath)) {
        const stats = fs.statSync(tempSongPath);
        if (stats.size < fileSize) {
          startByte = stats.size;
          logger.info(`Resuming download from byte ${startByte}`);
        }
      }

      const chunks = Math.ceil((fileSize - startByte) / chunkSize);
      const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });
      
      const clearGlobalTimeout = this.timeoutManager.setGlobalTimeout();

      try {
        for (let i = Math.floor(startByte / chunkSize); i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize - 1, fileSize - 1);
          
          const chunk = await this.downloadChunk(songUrl, start, end, song._id);
          writer.write(chunk);

          // İndirme durumunu kaydet
          downloadStateManager.saveDownloadState(song.playlistId, song._id, {
            downloadedChunks: i + 1,
            totalChunks: chunks,
            tempPath: tempSongPath,
            finalPath: finalSongPath,
            checksum: song.checksum
          });

          const progress = Math.round(((i + 1) / chunks) * 100);
          this.emit('progress', { 
            songId: song._id,
            playlistId: song.playlistId, 
            progress,
            downloadedSize: start + chunk.length,
            totalSize: fileSize,
            currentChunk: i + 1,
            totalChunks: chunks
          });
        }

        await new Promise((resolve) => writer.end(resolve));
        
        // Final checksum verification
        const isValid = await ChecksumVerifier.verifyFileChecksum(tempSongPath, song.checksum);
        if (!isValid) {
          throw new Error('Final checksum verification failed');
        }

        fs.renameSync(tempSongPath, finalSongPath);
        downloadStateManager.clearDownloadState(song.playlistId, song._id);
        logger.info(`Download completed for ${song.name}`);
        return finalSongPath;

      } finally {
        clearGlobalTimeout();
        this.timeoutManager.clearAll();
      }

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      
      const downloadState = downloadStateManager.getDownloadState(song.playlistId, song._id);
      const retryCount = (downloadState?.retryCount || 0) + 1;
      
      if (retryCount < this.MAX_RETRIES && NetworkErrorHandler.isRetryableError(error)) {
        downloadStateManager.saveDownloadState(song.playlistId, song._id, {
          ...downloadState,
          retryCount,
          lastError: error.message
        });
        
        logger.info(`Retrying download for ${song.name} (attempt ${retryCount}/${this.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.downloadSong(song, baseUrl, playlistDir);
      }
      
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return this.MIN_CHUNK_SIZE;
    if (fileSize < 100 * 1024 * 1024) return this.DEFAULT_CHUNK_SIZE;
    return this.MAX_CHUNK_SIZE;
  }

  async downloadChunk(url, start, end, songId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    let clearChunkTimeout;

    try {
      clearChunkTimeout = this.timeoutManager.setChunkTimeout(chunkId);

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000 // 30 saniye timeout
      });

      const chunk = response.data;
      const chunkChecksum = ChecksumVerifier.calculateMD5(chunk);
      
      if (!await ChecksumVerifier.verifyChunkChecksum(chunk, chunkChecksum)) {
        throw new Error('Chunk checksum verification failed');
      }

      return chunk;

    } catch (error) {
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

  resumeIncompleteDownloads(playlistId, baseUrl, playlistDir) {
    const incompleteDownloads = downloadStateManager.getIncompleteDownloads(playlistId);
    for (const download of incompleteDownloads) {
      this.queueSongDownload(download.song, baseUrl, playlistDir);
    }
  }
}

module.exports = new ChunkDownloadManager();