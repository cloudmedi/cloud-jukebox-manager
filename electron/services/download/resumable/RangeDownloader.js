const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const checkpointManager = require('./CheckpointManager');
const { EventEmitter } = require('events');

const logger = createLogger('range-downloader');
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

class RangeDownloader extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
  }

  async downloadWithResume(songUrl, songId, onProgress) {
    try {
      // Önce dosya boyutunu al
      const { headers } = await axios.head(songUrl);
      const totalSize = parseInt(headers['content-length'], 10);

      // Checkpoint kontrolü
      const checkpoint = checkpointManager.getCheckpoint(songId);
      const startByte = checkpoint ? checkpoint.bytesDownloaded : 0;

      logger.info(`Starting download for ${songId}:`, {
        totalSize,
        startByte,
        hasCheckpoint: !!checkpoint
      });

      const chunks = [];
      let downloadedBytes = startByte;

      // Range request ile indirme
      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=${startByte}-${totalSize - 1}`
        },
        onDownloadProgress: (progressEvent) => {
          const totalDownloaded = downloadedBytes + progressEvent.loaded;
          const progress = (totalDownloaded / totalSize) * 100;
          
          onProgress?.(progress);
          
          // Her chunk_size kadar veri indiğinde checkpoint oluştur
          if (totalDownloaded % CHUNK_SIZE === 0) {
            checkpointManager.saveCheckpoint(songId, totalDownloaded, totalSize);
          }
        }
      });

      // Son checkpoint'i kaydet
      checkpointManager.saveCheckpoint(songId, totalSize, totalSize);
      
      logger.info(`Download completed for ${songId}`);
      return response.data;

    } catch (error) {
      logger.error(`Error downloading ${songId}:`, error);
      throw error;
    }
  }

  async resumeIncompleteDownloads() {
    const incomplete = checkpointManager.getIncompleteDownloads();
    logger.info(`Found ${incomplete.length} incomplete downloads`);
    
    return incomplete;
  }

  cancelDownload(songId) {
    const download = this.activeDownloads.get(songId);
    if (download) {
      download.cancel();
      this.activeDownloads.delete(songId);
      logger.info(`Download cancelled for ${songId}`);
    }
  }
}

module.exports = new RangeDownloader();