const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const downloadStateManager = require('./managers/DownloadStateManager');
const chunkManager = require('./managers/ChunkManager');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.isProcessing = false;
    
    this.resumeIncompleteDownloads();
  }

  async resumeIncompleteDownloads() {
    try {
      const incompleteDownloads = downloadStateManager.getIncompleteDownloads();
      logger.info(`Found ${incompleteDownloads.length} incomplete downloads to resume`);

      for (const download of incompleteDownloads) {
        if (!download || !download.tempPath) {
          logger.warn('Invalid download state found:', download);
          continue;
        }

        if (fs.existsSync(download.tempPath)) {
          const stats = fs.statSync(download.tempPath);
          const resumePosition = stats.size;

          logger.info(`Resuming download for song ${download.songId} from position ${resumePosition}`);
          
          await this.resumeDownload(download, resumePosition);
        } else {
          logger.warn(`Temp file not found for song ${download.songId}: ${download.tempPath}`);
          // Temp dosya yoksa indirmeyi baştan başlat
          await this.resumeDownload(download, 0);
        }
      }
    } catch (error) {
      logger.error('Error resuming downloads:', error);
    }
  }

  async resumeDownload(download, resumePosition) {
    try {
      if (!download || !download.songId) {
        logger.warn('Invalid download state:', download);
        return;
      }

      const chunks = chunkManager.initializeChunks(
        download.songId,
        download.totalSize || 0,
        this.calculateChunkSize(download.totalSize || 0)
      );

      const completedChunks = Math.floor(resumePosition / this.calculateChunkSize(download.totalSize || 0));
      
      for (let i = 0; i < completedChunks; i++) {
        chunkManager.markChunkAsDownloaded(download.songId, i);
      }

      // Şarkı bilgilerini store'dan al
      const songDetails = downloadStateManager.getSongDetails(download.songId);
      if (!songDetails || !songDetails.filePath) {
        logger.error(`Missing song details for ${download.songId}`);
        return;
      }

      this.queueSongDownload({
        _id: download.songId,
        filePath: songDetails.filePath,
        ...download
      }, download.baseUrl, path.dirname(download.tempPath), true);
    } catch (error) {
      logger.error(`Error resuming download for song ${download?.songId}:`, error);
    }
  }

  async downloadSong(song, baseUrl, playlistDir, isResume = false) {
    logger.info(`Starting download for song: ${song._id}`);
    
    if (!song.filePath) {
      throw new Error(`Missing filePath for song: ${song._id}`);
    }

    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    try {
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);

      let startByte = 0;
      if (isResume && fs.existsSync(tempPath)) {
        const stats = fs.statSync(tempPath);
        startByte = stats.size;
      }

      // Song detaylarını kaydet
      downloadStateManager.saveSongDetails(song._id, {
        filePath: song.filePath,
        totalSize: fileSize,
        tempPath
      });

      const chunks = chunkManager.initializeChunks(song._id, fileSize, chunkSize);
      
      const writer = fs.createWriteStream(tempPath, { flags: startByte ? 'a' : 'w' });

      for (const chunk of chunks) {
        if (chunk.start < startByte) continue;

        const chunkData = await this.downloadChunk(songUrl, chunk.start, chunk.end, song._id);
        if (!chunkData) {
          logger.error(`Received null chunk data for song ${song._id}`);
          throw new Error('Received null chunk data');
        }
        
        writer.write(chunkData);
        
        chunkManager.markChunkAsDownloaded(song._id, chunk.index);
        downloadStateManager.updateDownloadProgress(song._id, chunkData.length, chunk.index);

        const progress = chunkManager.getDownloadProgress(song._id);
        this.emit('progress', { 
          songId: song._id, 
          progress,
          downloadedSize: chunk.end + 1,
          totalSize: fileSize,
          currentChunk: chunk.index + 1,
          totalChunks: chunks.length
        });
      }

      await new Promise((resolve) => writer.end(resolve));
      
      fs.renameSync(tempPath, songPath);
      downloadStateManager.completeDownload(song._id);
      chunkManager.clearSongChunks(song._id);
      
      logger.info(`Download completed for ${song._id}`);
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song._id}:`, error);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  async downloadChunk(url, start, end, songId) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { 
          Range: `bytes=${start}-${end}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error downloading chunk for song ${songId}:`, error);
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