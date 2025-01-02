const BaseDownloadManager = require('./managers/BaseDownloadManager');
const ChunkManager = require('./managers/ChunkManager');
const ProgressManager = require('./managers/ProgressManager');
const { createLogger } = require('../../utils/logger');

class ChunkDownloadManager extends BaseDownloadManager {
  constructor() {
    super();
    this.logger = createLogger('chunk-download-manager');
    this.chunkManager = new ChunkManager();
    this.progressManager = new ProgressManager();
  }

  initialize(deviceToken, wsUrl) {
    this.progressManager.initialize(deviceToken, wsUrl);
  }

  async processDownload(download) {
    const { url, playlistId } = download;
    
    try {
      const fileSize = await this.chunkManager.getFileSize(url);
      const chunks = this.chunkManager.calculateChunks(fileSize);
      
      for (const [index, chunk] of chunks.entries()) {
        const chunkData = await this.chunkManager.downloadChunk(
          url, 
          chunk.start, 
          chunk.end,
          (progressEvent) => {
            const progress = (index + progressEvent.loaded / progressEvent.total) / chunks.length;
            this.progressManager.updateProgress(playlistId, progress);
          }
        );

        await this.progressManager.markChunkCompleted(playlistId, `${index}`);
        this.emit('chunkComplete', { 
          downloadId: download.id, 
          chunkIndex: index, 
          totalChunks: chunks.length 
        });
      }

      return true;
    } catch (error) {
      this.logger.error(`Error processing download: ${error.message}`);
      throw error;
    }
  }

  cleanup() {
    this.progressManager.close();
  }
}

module.exports = new ChunkDownloadManager();