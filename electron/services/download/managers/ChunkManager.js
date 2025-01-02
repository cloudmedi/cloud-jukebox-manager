const { createLogger } = require('../../../utils/logger');

const logger = createLogger('chunk-manager');

class ChunkManager {
  constructor() {
    this.chunks = new Map();
  }

  initializeChunks(songId, fileSize, chunkSize) {
    const chunks = [];
    let start = 0;

    while (start < fileSize) {
      const end = Math.min(start + chunkSize - 1, fileSize - 1);
      chunks.push({
        index: chunks.length,
        start,
        end,
        downloaded: false
      });
      start = end + 1;
    }

    this.chunks.set(songId, chunks);
    logger.info(`Initialized ${chunks.length} chunks for song: ${songId}`);
    return chunks;
  }

  markChunkAsDownloaded(songId, chunkIndex) {
    const songChunks = this.chunks.get(songId);
    if (songChunks && songChunks[chunkIndex]) {
      songChunks[chunkIndex].downloaded = true;
      logger.debug(`Marked chunk ${chunkIndex} as downloaded for song: ${songId}`);
    }
  }

  getDownloadProgress(songId) {
    const songChunks = this.chunks.get(songId);
    if (!songChunks) return 0;

    const downloadedChunks = songChunks.filter(chunk => chunk.downloaded).length;
    return Math.round((downloadedChunks / songChunks.length) * 100);
  }

  clearSongChunks(songId) {
    this.chunks.delete(songId);
    logger.info(`Cleared chunks for song: ${songId}`);
  }
}

module.exports = new ChunkManager();