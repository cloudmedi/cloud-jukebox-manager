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

  updateChunkProgress(playlistId, chunkInfo) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) return;

    const { completedChunks, totalChunks } = chunkInfo;
    const progress = (completedChunks / totalChunks) * 100;

    download.progress = progress;
    this.broadcastProgress(download, playlistId);
  }

  updateDownloadedSongs(playlistId, downloadedSongs) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.downloadedSongs = downloadedSongs;
      this.broadcastProgress(download, playlistId);
    }
  }

  broadcastProgress(download, playlistId) {
    websocketService.send({
      type: 'downloadProgress',
      token: download.token,
      playlistId,
      totalSongs: download.totalSongs,
      downloadedSongs: download.downloadedSongs,
      progress: download.progress,
      status: download.status
    });
  }

  handleError(playlistId, error) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.status = 'error';
      download.error = error.message;
      this.broadcastProgress(download, playlistId);
    }
  }
}

module.exports = new DownloadProgressService();