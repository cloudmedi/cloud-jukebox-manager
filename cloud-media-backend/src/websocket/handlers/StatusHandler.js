const DeviceProgress = require('../../models/DeviceProgress');
const Device = require('../../models/Device');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleDownloadProgress(deviceToken, message) {
    try {
      const progress = await DeviceProgress.findOne({ deviceToken });
      if (!progress) return;

      await progress.updateProgress({
        progress: message.progress,
        downloadSpeed: message.speed,
        downloadedSongs: message.downloadedSongs,
        estimatedTimeRemaining: message.estimatedTimeRemaining
      });

      this.broadcastProgress(deviceToken, progress);
    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }

  async handleChunkCompleted(deviceToken, message) {
    try {
      const progress = await DeviceProgress.findOne({ deviceToken });
      if (!progress) return;

      await progress.markChunkCompleted(message.chunkId);
      this.broadcastProgress(deviceToken, progress);
    } catch (error) {
      console.error('Error handling chunk completion:', error);
    }
  }

  async handleDownloadError(deviceToken, message) {
    try {
      const progress = await DeviceProgress.findOne({ deviceToken });
      if (!progress) return;

      await progress.updateProgress({
        status: 'error',
        lastError: message.error,
        retryCount: (progress.retryCount || 0) + 1
      });

      this.broadcastProgress(deviceToken, progress);
    } catch (error) {
      console.error('Error handling download error:', error);
    }
  }

  async handleDownloadComplete(deviceToken, message) {
    try {
      const progress = await DeviceProgress.findOne({ deviceToken });
      if (!progress) return;

      await progress.updateProgress({
        status: 'completed',
        progress: 1
      });

      this.broadcastProgress(deviceToken, progress);
    } catch (error) {
      console.error('Error handling download completion:', error);
    }
  }

  broadcastProgress(deviceToken, progress) {
    this.wss.broadcastToAdmins({
      type: 'deviceStatus',
      token: deviceToken,
      playlistStatus: progress.status,
      downloadProgress: progress.progress,
      downloadSpeed: progress.downloadSpeed,
      downloadedSongs: progress.downloadedSongs,
      totalSongs: progress.totalSongs,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
      retryCount: progress.retryCount,
      lastError: progress.lastError
    });
  }
}

module.exports = StatusHandler;