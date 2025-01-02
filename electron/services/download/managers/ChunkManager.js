const { createLogger } = require('../../../utils/logger');

const logger = createLogger('chunk-manager');

class ChunkManager {
  constructor() {
    this.chunks = new Map();
  }

  initializeChunks(songId, fileSize, chunkSize) {
    try {
      const chunks = [];
      let start = 0;

      while (start < fileSize) {
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        chunks.push({
          index: chunks.length,
          start,
          end,
          downloaded: false,
          retryCount: 0
        });
        start = end + 1;
      }

      this.chunks.set(songId, chunks);
      logger.info(`Initialized ${chunks.length} chunks for song: ${songId}`);
      return chunks;
    } catch (error) {
      logger.error(`Error initializing chunks for ${songId}:`, error);
      throw error;
    }
  }

  markChunkAsDownloaded(songId, chunkIndex) {
    try {
      const songChunks = this.chunks.get(songId);
      if (songChunks && songChunks[chunkIndex]) {
        songChunks[chunkIndex].downloaded = true;
        songChunks[chunkIndex].downloadedAt = Date.now();
        logger.debug(`Marked chunk ${chunkIndex} as downloaded for song: ${songId}`);
      }
    } catch (error) {
      logger.error(`Error marking chunk as downloaded for ${songId}:`, error);
    }
  }

  getDownloadProgress(songId) {
    try {
      const songChunks = this.chunks.get(songId);
      if (!songChunks) return 0;

      const downloadedChunks = songChunks.filter(chunk => chunk.downloaded).length;
      return Math.round((downloadedChunks / songChunks.length) * 100);
    } catch (error) {
      logger.error(`Error calculating download progress for ${songId}:`, error);
      return 0;
    }
  }

  getUndownloadedChunks(songId) {
    try {
      const songChunks = this.chunks.get(songId);
      if (!songChunks) return [];
      
      return songChunks.filter(chunk => !chunk.downloaded);
    } catch (error) {
      logger.error(`Error getting undownloaded chunks for ${songId}:`, error);
      return [];
    }
  }

  clearSongChunks(songId) {
    try {
      this.chunks.delete(songId);
      logger.info(`Cleared chunks for song: ${songId}`);
    } catch (error) {
      logger.error(`Error clearing chunks for ${songId}:`, error);
    }
  }
}

module.exports = new ChunkManager();