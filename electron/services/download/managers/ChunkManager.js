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
    const songChunks = this.chunks.get(songId);
    if (songChunks && songChunks[chunkIndex]) {
      songChunks[chunkIndex].downloaded = true;
      songChunks[chunkIndex].downloadedAt = Date.now();
      logger.debug(`Marked chunk ${chunkIndex} as downloaded for song: ${songId}`);
    }
  }

  getDownloadProgress(songId) {
    const songChunks = this.chunks.get(songId);
    if (!songChunks) return 0;

    const downloadedChunks = songChunks.filter(chunk => chunk.downloaded).length;
    return Math.round((downloadedChunks / songChunks.length) * 100);
  }

  getUndownloadedChunks(songId) {
    const songChunks = this.chunks.get(songId);
    return songChunks ? songChunks.filter(chunk => !chunk.downloaded) : [];
  }

  clearSongChunks(songId) {
    this.chunks.delete(songId);
    logger.info(`Cleared chunks for song: ${songId}`);
  }
}

module.exports = new ChunkManager();