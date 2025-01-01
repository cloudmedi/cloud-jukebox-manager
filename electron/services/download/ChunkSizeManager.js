class ChunkSizeManager {
  constructor() {
    this.MIN_CHUNK_SIZE = 256 * 1024; // 256KB
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
    this.currentChunkSize = this.DEFAULT_CHUNK_SIZE;
    this.downloadSpeeds = [];
  }

  calculateAverageSpeed(bytesReceived, timeInMs) {
    const speedMbps = (bytesReceived / timeInMs) * 1000 / (1024 * 1024);
    this.downloadSpeeds.push(speedMbps);
    
    // Son 5 ölçümün ortalamasını al
    if (this.downloadSpeeds.length > 5) {
      this.downloadSpeeds.shift();
    }
    
    return this.downloadSpeeds.reduce((a, b) => a + b, 0) / this.downloadSpeeds.length;
  }

  adjustChunkSize(bytesReceived, timeInMs) {
    const averageSpeed = this.calculateAverageSpeed(bytesReceived, timeInMs);
    
    if (averageSpeed > 2) { // 2 Mbps üzeri hızlı bağlantı
      this.currentChunkSize = Math.min(
        this.currentChunkSize * 1.5,
        this.MAX_CHUNK_SIZE
      );
    } else if (averageSpeed < 0.5) { // 0.5 Mbps altı yavaş bağlantı
      this.currentChunkSize = Math.max(
        this.currentChunkSize * 0.75,
        this.MIN_CHUNK_SIZE
      );
    }

    return this.currentChunkSize;
  }

  getCurrentChunkSize() {
    return this.currentChunkSize;
  }

  reset() {
    this.currentChunkSize = this.DEFAULT_CHUNK_SIZE;
    this.downloadSpeeds = [];
  }
}

module.exports = new ChunkSizeManager();