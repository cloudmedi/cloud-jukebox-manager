const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const TimeoutManager = require('./utils/TimeoutManager');
const NetworkErrorHandler = require('./utils/NetworkErrorHandler');
const ChecksumVerifier = require('./utils/ChecksumVerifier');
const downloadStateManager = require('./DownloadStateManager');
const bandwidthManager = require('./BandwidthManager');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = bandwidthManager.maxConcurrentDownloads;
    this.timeoutManager = new TimeoutManager();
    this.isProcessing = false;

    logger.info('ChunkDownloadManager initialized');
    this.resumeIncompleteDownloads();
  }

  async resumeIncompleteDownloads() {
    const incompleteDownloads = downloadStateManager.getIncompleteDownloads();
    logger.info(`Found ${incompleteDownloads.length} incomplete downloads to resume`);

    for (const download of incompleteDownloads) {
      for (const song of download.songs) {
        if (song.status !== 'completed') {
          const songState = downloadStateManager.getSongState(song.id);
          if (songState.tempPath && fs.existsSync(songState.tempPath)) {
            this.queueSongDownload(song, download.baseUrl, download.downloadPath, true);
            logger.info(`Queued incomplete song for resume: ${song.name}`);
          }
        }
      }
    }
  }

  async downloadChunk(url, start, end, songId, playlistId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    const downloadId = `${songId}-${Date.now()}`;
    
    try {
      if (!bandwidthManager.startDownload(downloadId)) {
        logger.warn(`Download delayed due to bandwidth limits`, { chunkId });
        return new Promise(resolve => setTimeout(() => resolve(
          this.downloadChunk(url, start, end, songId, playlistId, retryCount)
        ), 1000));
      }

      const chunk = await this._performChunkDownload(url, start, end, songId, downloadId);
      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      bandwidthManager.finishDownload(downloadId);
      throw error;
    }
  }

  async _performChunkDownload(url, start, end, songId, downloadId) {
    const startTime = Date.now();
    let downloadedBytes = 0;
    let lastLogTime = Date.now();

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: { 
        Range: `bytes=${start}-${end}`
      },
      onDownloadProgress: async (progressEvent) => {
        const newBytes = progressEvent.loaded - downloadedBytes;
        downloadedBytes = progressEvent.loaded;
        
        await bandwidthManager.updateProgress(downloadId, newBytes);
        
        const now = Date.now();
        if (now - lastLogTime >= 1000) {
          const speed = (downloadedBytes / ((now - startTime) / 1000));
          logger.debug(`Download progress:`, {
            songId,
            chunkId: `${start}-${end}`,
            downloadedBytes: `${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB`,
            speed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`
          });
          lastLogTime = now;
        }
      }
    });

    return response.data;
  }

  async downloadSong(song, baseUrl, playlistDir, isResume = false) {
    logger.info(`Starting download for song: ${song.name}`);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    try {
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      
      // Resume control
      let startByte = 0;
      if (isResume && fs.existsSync(tempPath)) {
        const stats = fs.statSync(tempPath);
        startByte = stats.size;
        logger.info(`Resuming download from byte ${startByte}`);
      }

      const chunks = Math.ceil((fileSize - startByte) / chunkSize);
      const writer = fs.createWriteStream(tempPath, { flags: startByte ? 'a' : 'w' });
      
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * chunkSize);
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, playlistDir);
        if (!chunk) throw new Error('Received null chunk data');
        
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
      
      if (song.checksum) {
        const isValid = await ChecksumVerifier.verifyFileChecksum(tempPath, song.checksum);
        if (!isValid) {
          throw new Error('Final checksum verification failed');
        }
      }

      fs.renameSync(tempPath, songPath);
      logger.info(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir, isResume = false) {
    logger.info(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistDir, isResume });
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
          const { song, baseUrl, playlistDir, isResume } = download;
          this.activeDownloads.set(song._id, download);
          
          try {
            await this.downloadSong(song, baseUrl, playlistDir, isResume);
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

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB
    if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB
    return 2 * 1024 * 1024; // 2MB
  }
}

module.exports = new ChunkDownloadManager();