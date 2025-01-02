const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const bandwidthManager = require('./BandwidthManager');
const TimeoutManager = require('./utils/TimeoutManager');
const NetworkErrorHandler = require('./utils/NetworkErrorHandler');
const ChecksumVerifier = require('./utils/ChecksumVerifier');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxRetries = 3;
    this.retryDelays = [2000, 4000, 8000];
    this.isProcessing = false;
    this.chunkSize = 1024 * 1024; // 1MB default chunk size
  }

  calculateChunkSize(fileSize) {
    // Dosya boyutuna göre chunk size optimize et
    if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB for small files
    if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB for medium files
    return 2 * 1024 * 1024; // 2MB for large files
  }

  async downloadChunk(url, start, end, songId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    const downloadId = `${songId}-${Date.now()}`;

    try {
      if (!await bandwidthManager.startDownload(downloadId)) {
        logger.warn('Download delayed due to bandwidth limits', { chunkId });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.downloadChunk(url, start, end, songId, retryCount);
      }

      logger.info(`Starting chunk download: ${chunkId}`, {
        start,
        end,
        size: (end - start + 1) / (1024 * 1024)
      });

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000,
        onDownloadProgress: async (progressEvent) => {
          await bandwidthManager.updateProgress(downloadId, progressEvent.bytes);
        }
      });

      // Verify chunk integrity if checksum is available
      if (response.headers['x-chunk-checksum']) {
        const isValid = await ChecksumVerifier.verifyChunkChecksum(
          response.data,
          response.headers['x-chunk-checksum']
        );
        if (!isValid) {
          throw new Error('Chunk checksum verification failed');
        }
      }

      bandwidthManager.finishDownload(downloadId);
      return response.data;

    } catch (error) {
      bandwidthManager.finishDownload(downloadId);
      
      if (NetworkErrorHandler.isRetryableError(error) && retryCount < this.maxRetries) {
        logger.warn(`Retrying chunk download: ${chunkId}`, {
          attempt: retryCount + 1,
          maxRetries: this.maxRetries,
          error: error.message
        });

        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelays[retryCount])
        );

        return this.downloadChunk(url, start, end, songId, retryCount + 1);
      }

      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistDir) {
    logger.info(`Starting song download: ${song.name}`);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    try {
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      const chunks = Math.ceil(fileSize / chunkSize);

      const writer = fs.createWriteStream(tempPath);

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id);
        writer.write(chunk);

        this.emit('progress', {
          songId: song._id,
          progress: Math.round(((i + 1) / chunks) * 100),
          downloadedSize: start + chunk.length,
          totalSize: fileSize,
          currentChunk: i + 1,
          totalChunks: chunks
        });
      }

      await new Promise((resolve) => writer.end(resolve));

      // Verify final file checksum if available
      if (song.checksum) {
        const isValid = await ChecksumVerifier.verifyFileChecksum(tempPath, song.checksum);
        if (!isValid) {
          throw new Error('File checksum verification failed');
        }
      }

      fs.renameSync(tempPath, songPath);
      logger.info(`Song download completed: ${song.name}`);
      
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song: ${song.name}`, error);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }
}

module.exports = new ChunkDownloadManager();