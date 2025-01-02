const websocketService = require('../websocketService');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('download-progress-service');

class DownloadProgressService {
  constructor() {
    this.activeDownloads = new Map();
  }

  initializeDownload(token, playlistId, totalSongs) {
    logger.info('Initializing download:', { token, playlistId, totalSongs });
    
    this.activeDownloads.set(playlistId, {
      token,
      totalSongs,
      downloadedSongs: 0,
      progress: 0,
      status: 'downloading'
    });

    this.broadcastProgress(this.activeDownloads.get(playlistId), playlistId);
  }

  updateChunkProgress(playlistId, chunkInfo) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) {
      logger.warn('No active download found for playlist:', playlistId);
      return;
    }

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
    try {
      websocketService.send({
        type: 'downloadProgress',
        token: download.token,
        playlistId,
        totalSongs: download.totalSongs,
        downloadedSongs: download.downloadedSongs,
        progress: download.progress,
        status: download.status
      });
    } catch (error) {
      logger.error('Error broadcasting progress:', error);
    }
  }

  handleError(playlistId, error) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.status = 'error';
      download.error = error.message;
      this.broadcastProgress(download, playlistId);
    }
  }

  completeDownload(playlistId) {
    const download = this.activeDownloads.get(playlistId);
    if (download) {
      download.status = 'completed';
      download.progress = 100;
      this.broadcastProgress(download, playlistId);
      this.activeDownloads.delete(playlistId);
    }
  }
}

module.exports = new DownloadProgressService();