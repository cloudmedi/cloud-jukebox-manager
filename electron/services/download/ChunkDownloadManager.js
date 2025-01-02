const { EventEmitter } = require('events');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../../utils/logger');
const tempFileManager = require('./managers/TempFileManager');
const chunkOrderManager = require('./managers/ChunkOrderManager');
const retryStrategy = require('./strategies/RetryStrategy');
const bandwidthManager = require('./BandwidthManager');
const streamManager = require('./managers/StreamManager');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = bandwidthManager.maxConcurrentDownloads;
  }

  async downloadChunk(url, start, end, songId, playlistId) {
    const chunkId = `${songId}-${start}`;
    const downloadId = `${songId}-${Date.now()}`;

    try {
      if (!bandwidthManager.startDownload(downloadId)) {
        logger.warn(`Download delayed due to bandwidth limits`, { chunkId });
        return new Promise(resolve => setTimeout(() => resolve(
          this.downloadChunk(url, start, end, songId, playlistId)
        ), 1000));
      }

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000
      });

      bandwidthManager.finishDownload(downloadId);
      
      if (!response.data) {
        throw new Error('Received null chunk data from server');
      }

      return response.data;

    } catch (error) {
      logger.error(`Error downloading chunk: ${chunkId}`, error);
      
      if (retryStrategy.shouldRetry(error, songId)) {
        const delay = await retryStrategy.getNextRetryDelay(songId);
        logger.info(`Retrying chunk download after ${delay}ms`, { chunkId });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.downloadChunk(url, start, end, songId, playlistId);
      }
      
      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistDir) {
    logger.info(`Starting download for song: ${song.name}`);
    
    if (!song || !baseUrl || !playlistDir) {
      throw new Error('Missing required parameters for song download');
    }
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempSongPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    try {
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      const chunks = Math.ceil(fileSize / chunkSize);

      const writeStream = streamManager.createFileStream(tempSongPath);
      
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, playlistDir);
        
        if (!chunk) {
          throw new Error('Received null chunk during download');
        }

        await streamManager.writeChunkToStream(writeStream, chunk);

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

      await streamManager.closeStream(writeStream);
      
      fs.renameSync(tempSongPath, songPath);
      logger.info(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      writeStream?.destroy();
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir) {
    logger.info(`Queueing song download: ${song.name}`);
    
    this.downloadQueue.push({
      song,
      baseUrl,
      playlistDir
    });

    this.processQueue();
  }

  async processQueue() {
    if (this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return;
    }

    while (
      this.downloadQueue.length > 0 && 
      this.activeDownloads.size < this.maxConcurrentDownloads
    ) {
      const download = this.downloadQueue.shift();
      if (download) {
        this.activeDownloads.set(download.song._id, download);
        
        try {
          await this.downloadSong(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
        } finally {
          this.activeDownloads.delete(download.song._id);
          this.processQueue();
        }
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