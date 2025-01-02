const DownloadStateManager = require('./DownloadStateManager');
const websocketService = require('../websocketService');

class DownloadProgressService {
  constructor() {
    this.activeDownloads = new Map();
  }

  initializeDownload(token, playlistId, totalSongs) {
    this.activeDownloads.set(playlistId, {
      token,
      totalSongs,
      downloadedSongs: 0,
      progress: 0,
      status: 'downloading'
    });
  }

  updateProgress(playlistId, progress) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.progress = progress;
      this.saveState(playlistId, download);
      this.broadcastProgress(download);
    }
  }

  updateDownloadedSongs(playlistId, downloadedSongs) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.downloadedSongs = downloadedSongs;
      this.saveState(playlistId, download);
      this.broadcastProgress(download);
    }
  }

  saveState(playlistId, state) {
    DownloadStateManager.saveDownloadState(playlistId, state);
  }

  broadcastProgress(download) {
    websocketService.sendMessage({
      type: 'downloadProgress',
      ...download
    });
  }

  handleError(playlistId, error) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.status = 'error';
      download.error = error.message;
      this.saveState(playlistId, download);
      this.broadcastProgress(download);
    }
  }
}

module.exports = new DownloadProgressService();