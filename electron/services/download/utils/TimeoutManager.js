class TimeoutManager {
  constructor(globalTimeoutMs = 30 * 60 * 1000, chunkTimeoutMs = 30 * 1000) {
    this.globalTimeoutMs = globalTimeoutMs;
    this.chunkTimeoutMs = chunkTimeoutMs;
    this.timeouts = new Map();
  }

  setGlobalTimeout(callback) {
    const timeoutId = setTimeout(() => {
      callback(new Error('Global timeout exceeded'));
    }, this.globalTimeoutMs);
    
    return () => clearTimeout(timeoutId);
  }

  setChunkTimeout(chunkId, callback) {
    const timeoutId = setTimeout(() => {
      callback(new Error(`Chunk ${chunkId} timeout exceeded`));
    }, this.chunkTimeoutMs);
    
    this.timeouts.set(chunkId, timeoutId);
    return () => this.clearChunkTimeout(chunkId);
  }

  clearChunkTimeout(chunkId) {
    const timeoutId = this.timeouts.get(chunkId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(chunkId);
    }
  }

  clearAll() {
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
  }
}

module.exports = TimeoutManager;