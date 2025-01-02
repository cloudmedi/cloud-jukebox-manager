const { EventEmitter } = require('events');

class BandwidthManager extends EventEmitter {
  constructor() {
    super();
    this.maxConcurrentDownloads = 3;
    this.maxChunkSpeed = 2 * 1024 * 1024; // 2MB/s
    this.downloadPriority = 'low';
    this.activeDownloads = 0;
    
    console.log('BandwidthManager initialized with:', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      maxChunkSpeed: `${this.maxChunkSpeed / (1024 * 1024)}MB/s`,
      downloadPriority: this.downloadPriority
    });
  }

  canStartNewDownload() {
    return this.activeDownloads < this.maxConcurrentDownloads;
  }

  startDownload() {
    if (this.canStartNewDownload()) {
      this.activeDownloads++;
      console.log(`Starting new download. Active downloads: ${this.activeDownloads}`);
      return true;
    }
    return false;
  }

  finishDownload() {
    if (this.activeDownloads > 0) {
      this.activeDownloads--;
      console.log(`Finished download. Active downloads: ${this.activeDownloads}`);
    }
  }

  getThrottleSpeed() {
    return this.maxChunkSpeed;
  }

  setPriority(priority) {
    this.downloadPriority = priority;
    console.log(`Download priority set to: ${priority}`);
  }
}

module.exports = new BandwidthManager();