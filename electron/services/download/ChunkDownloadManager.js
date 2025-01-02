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
    const incompleteDownloads = downloadStateManager.getIncompleteDownloads();
    logger.info(`Found ${incompleteDownloads.length} incomplete downloads to resume`);

    for (const download of incompleteDownloads) {
      if (fs.existsSync(download.tempPath)) {
        const stats = fs.statSync(download.tempPath);
        const resumePosition = stats.size;

        logger.info(`Resuming download for song ${download.songId} from position ${resumePosition}`);
        
        await this.resumeDownload(download, resumePosition);
      }
    }
  }

  async resumeDownload(download, resumePosition) {
    const chunks = chunkManager.initializeChunks(
      download.songId,
      download.totalSize,
      this.calculateChunkSize(download.totalSize)
    );

    const completedChunks = Math.floor(resumePosition / this.calculateChunkSize(download.totalSize));
    
    for (let i = 0; i < completedChunks; i++) {
      chunkManager.markChunkAsDownloaded(download.songId, i);
    }

    this.queueSongDownload({
      _id: download.songId,
      ...download
    }, download.baseUrl, path.dirname(download.tempPath), true);
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

      let startByte = 0;
      if (isResume && fs.existsSync(tempPath)) {
        const stats = fs.statSync(tempPath);
        startByte = stats.size;
      }

      const downloadState = downloadStateManager.initializeDownload(song._id, fileSize, tempPath);
      const chunks = chunkManager.initializeChunks(song._id, fileSize, chunkSize);
      
      const writer = fs.createWriteStream(tempPath, { flags: startByte ? 'a' : 'w' });

      for (const chunk of chunks) {
        if (chunk.start < startByte) continue;

        const chunkData = await this.downloadChunk(songUrl, chunk.start, chunk.end, song._id);
        if (!chunkData) throw new Error('Received null chunk data');
        
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