const Device = require('../../models/Device');
const DownloadProgress = require('../../models/DownloadProgress');

class DownloadProgressHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleDownloadProgress(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      // Update download progress in database
      const downloadProgress = await DownloadProgress.findOneAndUpdate(
        {
          deviceToken: token,
          playlistId: message.playlistId
        },
        {
          status: 'downloading',
          progress: message.progress,
          downloadSpeed: message.downloadSpeed,
          downloadedSongs: message.downloadedSongs,
          totalSongs: message.totalSongs,
          estimatedTimeRemaining: message.estimatedTimeRemaining,
          completedChunks: message.completedChunks
        },
        { new: true, upsert: true }
      );

      // Broadcast progress to admin clients
      this.wss.broadcastToAdmins({
        type: 'downloadProgress',
        token: token,
        playlistId: message.playlistId,
        progress: downloadProgress.progress,
        downloadSpeed: downloadProgress.downloadSpeed,
        downloadedSongs: downloadProgress.downloadedSongs,
        totalSongs: downloadProgress.totalSongs,
        estimatedTimeRemaining: downloadProgress.estimatedTimeRemaining
      });

    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }
}

module.exports = DownloadProgressHandler;