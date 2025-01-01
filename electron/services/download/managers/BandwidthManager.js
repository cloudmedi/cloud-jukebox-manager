class BandwidthManager {
  constructor() {
    this.MAX_CONCURRENT_DOWNLOADS = 3;
    this.MAX_CHUNK_SPEED = 2 * 1024 * 1024; // 2MB/s
    this.activeDownloads = new Map();
    this.downloadQueue = [];
  }

  addDownload(songId, downloadInfo) {
    if (this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS) {
      this.activeDownloads.set(songId, {
        ...downloadInfo,
        startTime: Date.now(),
        bytesDownloaded: 0
      });
      return true;
    }
    
    this.downloadQueue.push({ songId, downloadInfo });
    return false;
  }

  updateDownloadProgress(songId, bytesDownloaded) {
    const download = this.activeDownloads.get(songId);
    if (download) {
      const now = Date.now();
      const timeDiff = (now - download.startTime) / 1000; // saniye cinsinden
      const speed = bytesDownloaded / timeDiff;

      if (speed > this.MAX_CHUNK_SPEED) {
        return false; // Hızı yavaşlat
      }

      download.bytesDownloaded = bytesDownloaded;
      return true;
    }
    return false;
  }

  completeDownload(songId) {
    this.activeDownloads.delete(songId);
    
    if (this.downloadQueue.length > 0 && this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS) {
      const nextDownload = this.downloadQueue.shift();
      this.addDownload(nextDownload.songId, nextDownload.downloadInfo);
    }
  }

  getActiveDownloads() {
    return Array.from(this.activeDownloads.entries());
  }

  getQueueLength() {
    return this.downloadQueue.length;
  }
}

module.exports = new BandwidthManager();