class MemoryManager {
  constructor() {
    this.downloadedChunks = new Map();
    this.chunkBuffers = new Map();
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
    this.memoryUsage = 0;
  }

  trackMemoryUsage(size, operation = 'add') {
    if (typeof size !== 'number') return;
    
    this.memoryUsage = operation === 'add' 
      ? this.memoryUsage + size 
      : this.memoryUsage - size;

    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      this.cleanupMemory(true);
    }
  }

  cleanupMemory(force = false) {
    console.log('Running memory cleanup...');
    
    for (const [songId, chunks] of this.downloadedChunks.entries()) {
      if (!chunks || !Array.isArray(chunks)) continue;
      
      if (force || this.isDownloadComplete(songId)) {
        const totalSize = chunks.reduce((acc, chunk) => {
          return acc + (chunk ? chunk.length : 0);
        }, 0);
        
        this.trackMemoryUsage(totalSize, 'subtract');
        this.downloadedChunks.delete(songId);
        this.chunkBuffers.delete(songId);
      }
    }
  }

  isDownloadComplete(songId) {
    if (!songId) return false;
    
    const chunks = this.downloadedChunks.get(songId);
    if (!chunks || !Array.isArray(chunks)) return false;
    
    return chunks.every(chunk => chunk !== null);
  }

  storeChunk(songId, chunkIndex, chunk) {
    if (!songId || typeof chunkIndex !== 'number' || !chunk) return;

    if (!this.downloadedChunks.has(songId)) {
      this.downloadedChunks.set(songId, []);
    }

    const chunks = this.downloadedChunks.get(songId);
    if (Array.isArray(chunks)) {
      chunks[chunkIndex] = chunk;
      this.trackMemoryUsage(chunk.length, 'add');
    }
  }

  getChunks(songId) {
    return this.downloadedChunks.get(songId) || [];
  }
}

module.exports = new MemoryManager();