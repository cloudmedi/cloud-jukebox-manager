const { createLogger } = require('../../../utils/logger');

const logger = createLogger('timeout-manager');

class TimeoutManager {
  constructor(globalTimeoutMs = 30 * 60 * 1000, chunkTimeoutMs = 30 * 1000) {
    this.globalTimeoutMs = globalTimeoutMs;
    this.chunkTimeoutMs = chunkTimeoutMs;
    this.timeouts = new Map();
    
    logger.info('TimeoutManager initialized', {
      globalTimeout: this.globalTimeoutMs,
      chunkTimeout: this.chunkTimeoutMs
    });
  }

  setGlobalTimeout(callback) {
    logger.debug('Setting global timeout');
    const timeoutId = setTimeout(() => {
      logger.error('Global timeout exceeded');
      callback(new Error('Global timeout exceeded'));
    }, this.globalTimeoutMs);
    
    return () => {
      logger.debug('Clearing global timeout');
      clearTimeout(timeoutId);
    };
  }

  setChunkTimeout(chunkId, callback) {
    logger.debug(`Setting chunk timeout for: ${chunkId}`);
    const timeoutId = setTimeout(() => {
      logger.error(`Chunk ${chunkId} timeout exceeded`);
      callback(new Error(`Chunk ${chunkId} timeout exceeded`));
    }, this.chunkTimeoutMs);
    
    this.timeouts.set(chunkId, timeoutId);
    return () => this.clearChunkTimeout(chunkId);
  }

  clearChunkTimeout(chunkId) {
    const timeoutId = this.timeouts.get(chunkId);
    if (timeoutId) {
      logger.debug(`Clearing chunk timeout for: ${chunkId}`);
      clearTimeout(timeoutId);
      this.timeouts.delete(chunkId);
    }
  }

  clearAll() {
    logger.debug('Clearing all timeouts');
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
  }

  updateTimeouts(globalTimeoutMs, chunkTimeoutMs) {
    this.globalTimeoutMs = globalTimeoutMs;
    this.chunkTimeoutMs = chunkTimeoutMs;
    logger.info('Timeout values updated', {
      globalTimeout: this.globalTimeoutMs,
      chunkTimeout: this.chunkTimeoutMs
    });
  }
}

module.exports = TimeoutManager;