class BandwidthManager {
  constructor() {
    this.MAX_CONCURRENT_DOWNLOADS = 3;
    this.MAX_CHUNK_SPEED = 2 * 1024 * 1024; // 2MB/s
    this.activeDownloads = new Map();
    this.downloadQueue = [];
  }

  canStartNewDownload() {
    return this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS;
  }

  addToQueue(downloadTask) {
    this.downloadQueue.push(downloadTask);
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) return;

    while (
      this.canStartNewDownload() && 
      this.downloadQueue.length > 0
    ) {
      const task = this.downloadQueue.shift();
      if (task) {
        await this.startDownload(task);
      }
    }
  }

  async startDownload(task) {
    if (!task || !task.songId) return;

    this.activeDownloads.set(task.songId, {
      startTime: Date.now(),
      isActive: true,
      priority: 'low'
    });

    try {
      await task.execute();
    } finally {
      this.activeDownloads.delete(task.songId);
      this.processQueue();
    }
  }

  throttleSpeed(chunkSize) {
    const delay = (chunkSize / this.MAX_CHUNK_SPEED) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

module.exports = new BandwidthManager();