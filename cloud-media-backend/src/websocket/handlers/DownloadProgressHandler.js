const Device = require('../../models/Device');

class DownloadProgressHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleDownloadProgress(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      // Update device download progress
      await Device.findByIdAndUpdate(device._id, {
        downloadProgress: message.progress || 0,
        downloadSpeed: message.speed || 0,
        downloadedSongs: message.downloadedSongs || 0,
        totalSongs: message.totalSongs || 0,
        estimatedTimeRemaining: message.estimatedTimeRemaining || 0,
        retryCount: message.retryCount || 0,
        lastError: message.error
      });

      // Broadcast to admin clients
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        downloadProgress: message.progress,
        downloadSpeed: message.speed,
        downloadedSongs: message.downloadedSongs,
        totalSongs: message.totalSongs,
        estimatedTimeRemaining: message.estimatedTimeRemaining,
        retryCount: message.retryCount,
        lastError: message.error
      });

    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }

  async handleDownloadState(token) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return null;

      return {
        downloadProgress: device.downloadProgress,
        downloadSpeed: device.downloadSpeed,
        downloadedSongs: device.downloadedSongs,
        totalSongs: device.totalSongs,
        estimatedTimeRemaining: device.estimatedTimeRemaining,
        retryCount: device.retryCount,
        lastError: device.lastError
      };
    } catch (error) {
      console.error('Error getting download state:', error);
      return null;
    }
  }
}

module.exports = DownloadProgressHandler;