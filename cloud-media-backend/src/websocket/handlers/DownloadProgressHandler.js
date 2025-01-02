const Device = require('../../models/Device');
const DownloadProgress = require('../../models/DownloadProgress');

class DownloadProgressHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleDownloadProgress(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      console.log('Processing download progress for device:', token, message);

      // Update download progress in database
      const downloadProgress = await DownloadProgress.findOneAndUpdate(
        {
          deviceToken: token,
          playlistId: message.data.playlistId
        },
        {
          status: message.data.status,
          progress: message.data.progress,
          downloadSpeed: message.data.downloadSpeed,
          downloadedSongs: message.data.downloadedSongs,
          totalSongs: message.data.totalSongs,
          estimatedTimeRemaining: message.data.estimatedTimeRemaining,
          completedChunks: message.data.completedChunks
        },
        { new: true, upsert: true }
      );

      // Broadcast progress to admin clients with correct data mapping
      this.wss.broadcastToAdmins({
        type: 'downloadProgress',
        token: token,
        playlistId: message.data.playlistId,
        progress: message.data.progress,
        downloadSpeed: message.data.downloadSpeed,
        downloadedSongs: message.data.downloadedSongs,
        totalSongs: message.data.totalSongs,
        estimatedTimeRemaining: message.data.estimatedTimeRemaining,
        status: message.data.status
      });

      console.log('Broadcast download progress to admins:', {
        token,
        playlistId: message.data.playlistId,
        progress: message.data.progress
      });

    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }

  async handleDownloadState(token) {
    try {
      const progress = await DownloadProgress.findOne({ deviceToken: token });
      return progress ? {
        playlistId: progress.playlistId,
        progress: progress.progress,
        downloadSpeed: progress.downloadSpeed,
        downloadedSongs: progress.downloadedSongs,
        totalSongs: progress.totalSongs,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
        status: progress.status
      } : null;
    } catch (error) {
      console.error('Error getting download state:', error);
      return null;
    }
  }
}

module.exports = DownloadProgressHandler;