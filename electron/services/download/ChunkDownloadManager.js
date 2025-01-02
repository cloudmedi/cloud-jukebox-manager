const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../../utils/logger');
const Store = require('electron-store');
const store = new Store();
const EventEmitter = require('events');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.downloadQueue = [];
    this.activeDownloads = 0;
    this.maxConcurrentDownloads = 3;
    this.baseDownloadPath = path.join(app.getPath('userData'), 'downloads');
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
      
      // Eğer dosya zaten varsa ve tamamsa, tekrar indirme
      if (fs.existsSync(songPath)) {
        const stats = fs.statSync(songPath);
        if (stats.size > 0) {
          logger.info(`Song already exists: ${song.name}`);
          this.emit('songDownloaded', { song, path: songPath });
          return songPath;
        }
      }

      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
      
      // İndirme işlemini başlat
      await this.downloadWithRetry(songUrl, songPath, song);
      
      logger.info(`Successfully downloaded song: ${song.name}`);
      this.emit('songDownloaded', { song, path: songPath });
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      this.emit('downloadError', { song, error });
      throw error;
    }
  }

  async downloadWithRetry(url, filePath, song, retryCount = 0) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const fileStream = fs.createWriteStream(filePath);
      const reader = response.body.getReader();
      let downloadedSize = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        downloadedSize += value.length;
        fileStream.write(Buffer.from(value));
        
        // İndirme ilerlemesini bildir
        this.emit('downloadProgress', {
          song,
          downloaded: downloadedSize,
          total: parseInt(response.headers.get('content-length') || '0')
        });
      }
      
      fileStream.end();
      
      return new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });

    } catch (error) {
      if (retryCount < 3 && this.isRetryableError(error)) {
        logger.warn(`Retrying download for ${song.name}, attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.downloadWithRetry(url, filePath, song, retryCount + 1);
      }
      throw error;
    }
  }

  isRetryableError(error) {
    return error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' || 
           error.code === 'ECONNREFUSED' ||
           (error.message && error.message.includes('network'));
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
      this.processQueue();
    }
  }
}

module.exports = new ChunkDownloadManager();