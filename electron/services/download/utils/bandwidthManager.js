class BandwidthManager {
  constructor() {
    this.MAX_CONCURRENT_DOWNLOADS = 3;
    this.MAX_CHUNK_SPEED = 2 * 1024 * 1024; // 2MB/s
    this.downloadQueue = [];
    this.activeDownloads = new Map();
  }

  async throttleSpeed(chunk) {
    const chunkSize = chunk.length;
    const startTime = process.hrtime();
    
    // Hedeflenen minimum süre (saniye olarak)
    const targetTime = chunkSize / this.MAX_CHUNK_SPEED;
    
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const actualTime = seconds + nanoseconds / 1e9;
    
    if (actualTime < targetTime) {
      const delayMs = Math.floor((targetTime - actualTime) * 1000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  canStartNewDownload() {
    return this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS;
  }

  addToQueue(downloadTask) {
    this.downloadQueue.push(downloadTask);
  }

  getNextDownload() {
    return this.downloadQueue.shift();
  }

  trackDownload(id, download) {
    this.activeDownloads.set(id, download);
  }

  removeDownload(id) {
    this.activeDownloads.delete(id);
  }

  setPriority() {
    if (process.platform === 'win32') {
      try {
        // Windows'ta process önceliğini düşür
        require('os').setPriority(process.pid, 'below_normal');
      } catch (error) {
        console.warn('Process priority could not be set:', error);
      }
    } else {
      try {
        // Unix sistemlerde nice değerini artır
        process.setpriority(10);
      } catch (error) {
        console.warn('Process priority could not be set:', error);
      }
    }
  }
}

module.exports = new BandwidthManager();