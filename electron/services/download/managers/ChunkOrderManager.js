const { createLogger } = require('../../../utils/logger');

const logger = createLogger('chunk-order-manager');

class ChunkOrderManager {
  constructor() {
    this.chunkQueues = new Map();
  }

  initializeQueue(songId, totalChunks) {
    this.chunkQueues.set(songId, {
      expectedChunkIndex: 0,
      totalChunks,
      pendingChunks: new Map(),
      completedChunks: 0
    });
    logger.info(`Initialized chunk queue for song: ${songId}, total chunks: ${totalChunks}`);
  }

  canProcessChunk(songId, chunkIndex) {
    const queue = this.chunkQueues.get(songId);
    return queue && chunkIndex === queue.expectedChunkIndex;
  }

  queueChunk(songId, chunkIndex, chunkData) {
    const queue = this.chunkQueues.get(songId);
    if (!queue) return false;

    queue.pendingChunks.set(chunkIndex, chunkData);
    return true;
  }

  getNextChunk(songId) {
    const queue = this.chunkQueues.get(songId);
    if (!queue) return null;

    const chunk = queue.pendingChunks.get(queue.expectedChunkIndex);
    if (chunk) {
      queue.pendingChunks.delete(queue.expectedChunkIndex);
      queue.expectedChunkIndex++;
      queue.completedChunks++;
      return chunk;
    }
    return null;
  }

  isComplete(songId) {
    const queue = this.chunkQueues.get(songId);
    return queue && queue.completedChunks === queue.totalChunks;
  }

  getProgress(songId) {
    const queue = this.chunkQueues.get(songId);
    if (!queue) return 0;
    return (queue.completedChunks / queue.totalChunks) * 100;
  }

  cleanup(songId) {
    this.chunkQueues.delete(songId);
    logger.info(`Cleaned up chunk queue for song: ${songId}`);
  }
}

module.exports = new ChunkOrderManager();