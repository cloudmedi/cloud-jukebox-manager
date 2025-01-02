const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const downloadProgressService = require('../DownloadProgressService');
const bandwidthManager = require('../BandwidthManager');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.isProcessing = false;
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

      const chunk = await this._performChunkDownload(url, start, end, downloadId);
      
      downloadProgressService.updateChunkProgress(playlistId, {
        chunkId,
        songId,
        size: chunk.length,
        status: 'completed'
      });

      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      bandwidthManager.finishDownload(downloadId);
      throw error;
    }
  }

  async _performChunkDownload(url, start, end, downloadId) {
    const startTime = Date.now();
    let downloadedBytes = 0;

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
      }
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const speed = downloadedBytes / duration;

    logger.info(`[CHUNK COMPLETE] Chunk download completed:`, {
      downloadId,
      chunkSize: `${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB`,
      duration: `${duration.toFixed(2)}s`,
      speed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`
    });

    return response.data;
  }

  async downloadSong(song, baseUrl, playlistDir) {
    logger.info(`Starting download for song: ${song.name}`);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempSongPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    const { headers } = await axios.head(songUrl);
    const fileSize = parseInt(headers['content-length'], 10);
    const chunkSize = this.calculateChunkSize(fileSize);
    
    const chunks = Math.ceil(fileSize / chunkSize);
    const writer = fs.createWriteStream(tempSongPath);
    
    try {
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, song.playlistId);
        writer.write(chunk);
      }

      await new Promise((resolve) => writer.end(resolve));
      fs.renameSync(tempSongPath, songPath);
      logger.info(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB
    if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB
    return 2 * 1024 * 1024; // 2MB
  }
}

module.exports = new ChunkDownloadManager();