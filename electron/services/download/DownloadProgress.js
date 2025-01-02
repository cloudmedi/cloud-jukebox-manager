class DownloadProgress {
  constructor() {
    this.activeDownloads = new Map();
  }

  initializeDownload(songId, totalChunks) {
    this.activeDownloads.set(songId, {
      isActive: true,
      lastActive: Date.now(),
      totalChunks,
      progress: 0
    });
  }

  updateProgress(songId, progress) {
    const download = this.activeDownloads.get(songId);
    if (download) {
      download.lastActive = Date.now();
      download.progress = progress;
    }
  }

  completeDownload(songId) {
    const download = this.activeDownloads.get(songId);
    if (download) {
      download.isActive = false;
      download.progress = 100;
    }
  }

  getProgress(songId) {
    return this.activeDownloads.get(songId);
  }
}

module.exports = DownloadProgress;