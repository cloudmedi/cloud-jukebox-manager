const { EventEmitter } = require('events');
const websocketService = require('../websocketService');

class DownloadProgressService extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
  }

  initializeDownload(deviceToken, playlistId, totalSongs) {
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

  updateProgress(playlistId, chunkInfo) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) return;

    const now = Date.now();
    const elapsed = (now - download.startTime) / 1000;

    // Chunk bilgilerini güncelle
    download.completedChunks.push(chunkInfo);
    
    // İlerleme hesapla
    const totalChunks = download.totalSongs * 100; // Varsayılan chunk sayısı
    download.progress = (download.completedChunks.length / totalChunks) * 100;
    
    // İndirme hızı hesapla (bytes/second)
    const totalBytes = download.completedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    download.downloadSpeed = totalBytes / elapsed;
    
    // Kalan süreyi hesapla
    const remainingChunks = totalChunks - download.completedChunks.length;
    const avgChunkTime = elapsed / download.completedChunks.length;
    download.estimatedTimeRemaining = remainingChunks * avgChunkTime;

    // İndirilen şarkı sayısını güncelle
    const uniqueSongs = new Set(download.completedChunks.map(c => c.songId));
    download.downloadedSongs = uniqueSongs.size;

    this.emitProgress(download);
  }

  emitProgress(downloadState) {
    // WebSocket üzerinden ilerleme bilgisini gönder
    websocketService.sendMessage({
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
        retryCount: downloadState.retryCount
      }
    });
  }

  completeDownload(playlistId) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) return;

    download.status = 'completed';
    download.progress = 100;
    this.emitProgress(download);
    this.activeDownloads.delete(playlistId);
  }

  handleError(playlistId, error) {
    const download = this.activeDownloads.get(playlistId);
    if (!download) return;

    download.status = 'error';
    download.lastError = error.message;
    download.retryCount++;
    this.emitProgress(download);
  }

  getDownloadState(playlistId) {
    return this.activeDownloads.get(playlistId);
  }
}

module.exports = new DownloadProgressService();