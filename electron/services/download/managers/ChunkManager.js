const { createLogger } = require('../../../utils/logger');
const logger = createLogger('chunk-manager');

class ChunkManager {
  constructor() {
    this.chunks = new Map();
  }

  initializeChunks(songId, totalSize, chunkSize) {
    const totalChunks = Math.ceil(totalSize / chunkSize);
    const chunkRanges = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, totalSize - 1);
      chunkRanges.push({ start, end, index: i });
    }

    this.chunks.set(songId, {
      ranges: chunkRanges,
      downloaded: new Set(),
      total: totalChunks
    });

    logger.info(`Initialized ${totalChunks} chunks for song: ${songId}`);
    return chunkRanges;
  }

  markChunkAsDownloaded(songId, chunkIndex) {
    const songChunks = this.chunks.get(songId);
    if (songChunks) {
      songChunks.downloaded.add(chunkIndex);
      logger.debug(`Chunk ${chunkIndex} marked as downloaded for song: ${songId}`);
    }
  }

  getRemainingChunks(songId) {
    const songChunks = this.chunks.get(songId);
    if (!songChunks) return [];

    return songChunks.ranges.filter(chunk => 
      !songChunks.downloaded.has(chunk.index)
    );
  }

  getDownloadProgress(songId) {
    const songChunks = this.chunks.get(songId);
    if (!songChunks) return 0;

    return (songChunks.downloaded.size / songChunks.total) * 100;
  }

  clearSongChunks(songId) {
    this.chunks.delete(songId);
    logger.info(`Cleared chunks for song: ${songId}`);
  }
}

module.exports = new ChunkManager();