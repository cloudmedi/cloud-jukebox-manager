const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const bandwidthManager = require('../BandwidthManager');
const downloadProgressService = require('../DownloadProgressService');
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
        logger.warn('Download delayed due to bandwidth limits', { chunkId });
        return new Promise(resolve => setTimeout(() => resolve(
          this.downloadChunk(url, start, end, songId, playlistId)
        ), 1000));
      }

      const chunk = await this._performChunkDownload(url, start, end, downloadId);
      
      // İlerleme bilgisini güncelle
      const downloadInfo = this.activeDownloads.get(playlistId);
      if (downloadInfo) {
        downloadInfo.completedChunks = (downloadInfo.completedChunks || 0) + 1;
        downloadProgressService.updateChunkProgress(playlistId, {
          completedChunks: downloadInfo.completedChunks,
          totalChunks: downloadInfo.totalChunks
        });
      }

      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      logger.error('Error downloading chunk:', error);
      bandwidthManager.finishDownload(downloadId);
      downloadProgressService.handleError(playlistId, error);
      throw error;
    }
  }

  async _performChunkDownload(url, start, end, downloadId) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: { 
        Range: `bytes=${start}-${end}`
      },
      onDownloadProgress: async (progressEvent) => {
        await bandwidthManager.updateProgress(downloadId, progressEvent.loaded);
      }
    });

    return response.data;
  }

  async downloadSong(song, baseUrl, playlistDir) {
    logger.info('Starting download for song:', song.name);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    try {
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      const chunks = Math.ceil(fileSize / chunkSize);
      
      // İndirme durumunu başlat
      this.activeDownloads.set(song.playlistId, {
        completedChunks: 0,
        totalChunks: chunks
      });

      const writer = fs.createWriteStream(songPath);

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, song.playlistId);
        writer.write(chunk);
      }

      await new Promise((resolve) => writer.end(resolve));
      logger.info('Download completed for:', song.name);
      return songPath;

    } catch (error) {
      logger.error('Error downloading song:', error);
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