const { EventEmitter } = require('events');
const websocketService = require('../websocketService');

class DownloadProgressService extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
  }

  initializeDownload(deviceToken, playlistId, totalSongs) {
    console.log('Initializing download:', { deviceToken, playlistId, totalSongs });
    
    const downloadState = {
      deviceToken,
      playlistId,
      status: 'downloading',
      progress: 0,
      downloadSpeed: 0,
      downloadedSongs: 0,
      totalSongs,
      estimatedTimeRemaining: 0,
      retryCount: 0,
      startTime: Date.now(),
      completedChunks: []
    };

    this.activeDownloads.set(playlistId, downloadState);
    this.emitProgress(downloadState);
  }

  updateChunkProgress(playlistId, chunkInfo) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) {
      console.warn('No active download found for playlist:', playlistId);
      return;
    }

    download.completedChunks.push(chunkInfo);
    this.calculateProgress(download);
    this.emitProgress(download);
  }

  calculateProgress(download) {
    const totalChunks = download.totalSongs * 100; // Assuming 100 chunks per song
    download.progress = (download.completedChunks.length / totalChunks) * 100;
    
    const now = Date.now();
    const elapsed = (now - download.startTime) / 1000;
    
    const totalBytes = download.completedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    download.downloadSpeed = totalBytes / elapsed;
    
    const remainingChunks = totalChunks - download.completedChunks.length;
    const avgChunkTime = elapsed / download.completedChunks.length;
    download.estimatedTimeRemaining = remainingChunks * avgChunkTime;
  }

  emitProgress(downloadState) {
    console.log('Emitting download progress:', downloadState);
    
    try {
      websocketService.send({
        type: 'downloadProgress',
        data: {
          playlistId: downloadState.playlistId,
          deviceToken: downloadState.deviceToken,
          status: downloadState.status,
          progress: downloadState.progress,
          downloadSpeed: downloadState.downloadSpeed,
          downloadedSongs: downloadState.downloadedSongs,
          totalSongs: downloadState.totalSongs,
          estimatedTimeRemaining: downloadState.estimatedTimeRemaining,
          retryCount: downloadState.retryCount,
          completedChunks: downloadState.completedChunks,
          lastError: downloadState.lastError
        }
      });
    } catch (error) {
      console.error('Error sending progress update:', error);
    }
  }

  handleError(playlistId, error) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) return;

    download.status = 'error';
    download.lastError = error.message;
    download.retryCount++;
    
    this.emitProgress(download);
  }
}

module.exports = new DownloadProgressService();