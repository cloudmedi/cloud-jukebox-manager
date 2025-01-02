class ChunkStorage {
  constructor() {
    this.downloadedChunks = new Map();
  }

  initializeForSong(songId) {
    if (!this.downloadedChunks.has(songId)) {
      this.downloadedChunks.set(songId, []);
    }
  }

  addChunk(songId, chunk) {
    this.initializeForSong(songId);
    this.downloadedChunks.get(songId).push(chunk);
  }

  getChunks(songId) {
    return this.downloadedChunks.get(songId) || [];
  }

  clearSong(songId) {
    this.downloadedChunks.delete(songId);
  }
}

module.exports = ChunkStorage;