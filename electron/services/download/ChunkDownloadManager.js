const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../../utils/logger');
const Store = require('electron-store');
const EventEmitter = require('events');
const NetworkErrorHandler = require('./utils/NetworkErrorHandler');
const TimeoutManager = require('./utils/TimeoutManager');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.store = new Store({
      name: 'download-state',
      defaults: {
        downloads: {},
        chunks: {},
        activeDownloads: 0
      }
    });
    
    this.downloadQueue = [];
    this.activeDownloads = 0;
    this.maxConcurrentDownloads = 3;
    this.baseDownloadPath = path.join(app.getPath('userData'), 'downloads');
    this.timeoutManager = new TimeoutManager();
    this.chunkSize = 1024 * 1024; // 1MB default
    this.ensureBaseDirectory();
  }

  ensureBaseDirectory() {
    if (!fs.existsSync(this.baseDownloadPath)) {
      fs.mkdirSync(this.baseDownloadPath, { recursive: true });
      logger.info(`Created base download directory: ${this.baseDownloadPath}`);
    }
  }

  getPlaylistDirectory(playlistId) {
    return path.join(this.baseDownloadPath, playlistId);
  }

  ensurePlaylistDirectory(playlistId) {
    const playlistDir = this.getPlaylistDirectory(playlistId);
    if (!fs.existsSync(playlistDir)) {
      fs.mkdirSync(playlistDir, { recursive: true });
      logger.info(`Created playlist directory: ${playlistDir}`);
    }
    return playlistDir;
  }

  async downloadSong(song, baseUrl, playlistId) {
    try {
      logger.info(`Starting download for song: ${song.name}`);
      
      const playlistDir = this.ensurePlaylistDirectory(playlistId);
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      
      // Check if download state exists
      const downloadState = this.store.get(`downloads.${song._id}`);
      if (downloadState && downloadState.completed) {
        logger.info(`Song already downloaded: ${song.name}`);
        this.emit('songDownloaded', { song, path: songPath });
        return songPath;
      }

      const songUrl = new URL(song.filePath, baseUrl).toString();
      
      // Initialize download state
      this.store.set(`downloads.${song._id}`, {
        songId: song._id,
        playlistId,
        url: songUrl,
        path: songPath,
        chunks: [],
        started: Date.now(),
        completed: false,
        retryCount: 0
      });

      // Start download with chunks
      await this.downloadWithChunks(songUrl, songPath, song);
      
      // Update download state
      this.store.set(`downloads.${song._id}.completed`, true);
      
      logger.info(`Successfully downloaded song: ${song.name}`);
      this.emit('songDownloaded', { song, path: songPath });
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      this.emit('downloadError', { song, error });
      throw error;
    }
  }

  async downloadWithChunks(url, filePath, song) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const totalSize = parseInt(response.headers.get('content-length') || '0');
      const chunks = Math.ceil(totalSize / this.chunkSize);
      
      const fileStream = fs.createWriteStream(filePath);
      let downloadedSize = 0;
      
      for (let i = 0; i < chunks; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, totalSize);
        
        // Check if chunk already exists
        const chunkState = this.store.get(`chunks.${song._id}.${i}`);
        if (chunkState && chunkState.completed) {
          downloadedSize += chunkState.size;
          continue;
        }

        const chunkResponse = await fetch(url, {
          headers: { Range: `bytes=${start}-${end}` }
        });

        if (!chunkResponse.ok) {
          throw new Error(`Chunk download failed: ${chunkResponse.status}`);
        }

        const chunk = await chunkResponse.arrayBuffer();
        fileStream.write(Buffer.from(chunk));
        
        downloadedSize += chunk.byteLength;
        
        // Save chunk state
        this.store.set(`chunks.${song._id}.${i}`, {
          completed: true,
          size: chunk.byteLength,
          timestamp: Date.now()
        });

        // Emit progress
        this.emit('downloadProgress', {
          song,
          downloaded: downloadedSize,
          total: totalSize,
          progress: (downloadedSize / totalSize) * 100
        });
      }
      
      fileStream.end();
      
      return new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });

    } catch (error) {
      if (NetworkErrorHandler.isRetryableError(error)) {
        const downloadState = this.store.get(`downloads.${song._id}`);
        if (downloadState.retryCount < 3) {
          logger.warn(`Retrying download for ${song.name}`);
          this.store.set(`downloads.${song._id}.retryCount`, downloadState.retryCount + 1);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.downloadWithChunks(url, filePath, song);
        }
      }
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistId) {
    this.downloadQueue.push({ song, baseUrl, playlistId });
    this.processQueue();
  }

  async processQueue() {
    if (this.activeDownloads >= this.maxConcurrentDownloads || this.downloadQueue.length === 0) {
      return;
    }

    this.activeDownloads++;
    const { song, baseUrl, playlistId } = this.downloadQueue.shift();

    try {
      await this.downloadSong(song, baseUrl, playlistId);
    } catch (error) {
      logger.error(`Queue processing error for ${song.name}:`, error);
    } finally {
      this.activeDownloads--;
      this.store.set('activeDownloads', this.activeDownloads);
      this.processQueue();
    }
  }

  clearDownloadState(songId) {
    this.store.delete(`downloads.${songId}`);
    this.store.delete(`chunks.${songId}`);
  }
}

module.exports = new ChunkDownloadManager();