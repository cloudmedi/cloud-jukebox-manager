const MemoryLock = require('./MemoryLock');

class ChunkMemoryManager {
  constructor() {
    this.downloadedChunks = new Map();
    this.chunkBuffers = new Map();
    this.memoryUsage = 0;
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
  }

  async initializeChunkArray(songId) {
    await MemoryLock.acquire(songId);
    try {
      if (!this.downloadedChunks.has(songId)) {
        this.downloadedChunks.set(songId, []);
      }
    } finally {
      MemoryLock.release(songId);
    }
  }

  async addChunk(songId, chunk) {
    await MemoryLock.acquire(songId);
    try {
      if (!this.downloadedChunks.has(songId)) {
        await this.initializeChunkArray(songId);
      }
      
      const chunks = this.downloadedChunks.get(songId);
      if (chunks) {
        chunks.push(chunk);
        this.memoryUsage += chunk.length;
        this.checkMemoryUsage();
      }
    } finally {
      MemoryLock.release(songId);
    }
  }

  async getChunks(songId) {
    await MemoryLock.acquire(songId);
    try {
      return this.downloadedChunks.get(songId) || [];
    } finally {
      MemoryLock.release(songId);
    }
  }

  checkMemoryUsage() {
    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      this.cleanupMemory(true);
    }
  }

  async cleanupMemory(force = false) {
    console.log('Running memory cleanup...');
    
    for (const [songId, chunks] of this.downloadedChunks.entries()) {
      await MemoryLock.acquire(songId);
      try {
        if (force || this.isDownloadComplete(songId)) {
          const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          this.memoryUsage -= totalSize;
          this.downloadedChunks.delete(songId);
          this.chunkBuffers.delete(songId);
          console.log(`Cleaned up chunks for song: ${songId}`);
        }
      } finally {
        MemoryLock.release(songId);
      }
    }
  }

  isDownloadComplete(songId) {
    return this.downloadedChunks.has(songId) && 
           this.downloadedChunks.get(songId).length > 0;
  }
}

module.exports = new ChunkMemoryManager();