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

      // Calculate completed songs based on chunks
      const completedSongs = this.calculateCompletedSongs(message.data.completedChunks);

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
          downloadedSongs: completedSongs,
          totalSongs: message.data.totalSongs,
          estimatedTimeRemaining: message.data.estimatedTimeRemaining,
          completedChunks: message.data.completedChunks,
          lastUpdated: new Date()
        },
        { new: true, upsert: true }
      );

      // Single broadcast to admin clients with complete data
      this.wss.broadcastToAdmins({
        type: 'downloadProgress',
        token: token,
        playlistId: message.data.playlistId,
        progress: message.data.progress,
        downloadSpeed: message.data.downloadSpeed,
        downloadedSongs: completedSongs,
        totalSongs: message.data.totalSongs,
        estimatedTimeRemaining: message.data.estimatedTimeRemaining,
        status: message.data.status
      });

    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }

  calculateCompletedSongs(completedChunks) {
    if (!completedChunks || !Array.isArray(completedChunks)) {
      return 0;
    }

    // Group chunks by songId
    const songChunks = completedChunks.reduce((acc, chunk) => {
      if (!acc[chunk.songId]) {
        acc[chunk.songId] = [];
      }
      acc[chunk.songId].push(chunk);
      return acc;
    }, {});

    // Count songs where all chunks are downloaded
    let completedCount = 0;
    for (const songId in songChunks) {
      const chunks = songChunks[songId];
      // A song is considered complete if it has at least 10 chunks
      if (chunks.length >= 10) {
        completedCount++;
      }
    }

    return completedCount;
  }

  async handleDownloadState(token) {
    try {
      // Get the most recent download progress for the device
      const progress = await DownloadProgress.findOne(
        { deviceToken: token },
        {},
        { sort: { lastUpdated: -1 } }
      );

      if (!progress) {
        console.log('No download state found for device:', token);
        return null;
      }

      // Check if the download is still active (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (progress.lastUpdated < fiveMinutesAgo) {
        console.log('Download state is too old, not resuming');
        return null;
      }

      return {
        playlistId: progress.playlistId,
        progress: progress.progress,
        downloadSpeed: progress.downloadSpeed,
        downloadedSongs: progress.downloadedSongs,
        totalSongs: progress.totalSongs,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
        status: progress.status,
        completedChunks: progress.completedChunks
      };
    } catch (error) {
      console.error('Error getting download state:', error);
      return null;
    }
  }
}

module.exports = DownloadProgressHandler;