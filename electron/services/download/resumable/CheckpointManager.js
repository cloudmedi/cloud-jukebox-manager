const Store = require('electron-store');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('checkpoint-manager');

class CheckpointManager {
  constructor() {
    this.store = new Store({
      name: 'download-checkpoints',
      defaults: {
        checkpoints: {}
      }
    });
  }

  saveCheckpoint(songId, bytesDownloaded, totalBytes) {
    try {
      const checkpoint = {
        bytesDownloaded,
        totalBytes,
        timestamp: Date.now(),
        completed: bytesDownloaded === totalBytes
      };

      this.store.set(`checkpoints.${songId}`, checkpoint);
      logger.info(`Checkpoint saved for song ${songId}:`, checkpoint);
    } catch (error) {
      logger.error(`Error saving checkpoint for song ${songId}:`, error);
    }
  }

  getCheckpoint(songId) {
    return this.store.get(`checkpoints.${songId}`);
  }

  clearCheckpoint(songId) {
    this.store.delete(`checkpoints.${songId}`);
    logger.info(`Checkpoint cleared for song ${songId}`);
  }

  getIncompleteDownloads() {
    const checkpoints = this.store.get('checkpoints');
    return Object.entries(checkpoints)
      .filter(([_, checkpoint]) => !checkpoint.completed)
      .map(([songId, checkpoint]) => ({
        songId,
        ...checkpoint
      }));
  }
}

module.exports = new CheckpointManager();