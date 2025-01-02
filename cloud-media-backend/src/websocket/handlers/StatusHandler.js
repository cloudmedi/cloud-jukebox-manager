const Device = require('../../models/Device');
const DownloadProgress = require('../../models/DownloadProgress');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      // İndirme durumunu güncelle
      const downloadProgress = await DownloadProgress.findOneAndUpdate(
        { 
          deviceToken: token,
          playlistId: message.playlistId 
        },
        {
          status: message.status,
          progress: message.progress || 0,
          downloadSpeed: message.speed || 0,
          downloadedSongs: message.downloadedSongs || 0,
          totalSongs: message.totalSongs || 0,
          estimatedTimeRemaining: message.estimatedTimeRemaining || 0,
          retryCount: message.retryCount || 0,
          lastError: message.error,
          lastUpdated: new Date()
        },
        { 
          new: true,
          upsert: true 
        }
      );

      // Cihaz durumunu güncelle
      await Device.findByIdAndUpdate(device._id, {
        playlistStatus: message.status === 'completed' ? 'loaded' : message.status,
        downloadProgress: message.progress || 0,
        downloadSpeed: message.speed || 0,
        downloadedSongs: message.downloadedSongs || 0,
        totalSongs: message.totalSongs || 0,
        estimatedTimeRemaining: message.estimatedTimeRemaining || 0,
        retryCount: message.retryCount || 0,
        lastError: message.error
      });

      // Admin paneline bildir
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playlistStatus: message.status,
        playlistId: message.playlistId,
        downloadProgress: downloadProgress.progress,
        downloadSpeed: downloadProgress.downloadSpeed,
        downloadedSongs: downloadProgress.downloadedSongs,
        totalSongs: downloadProgress.totalSongs,
        estimatedTimeRemaining: downloadProgress.estimatedTimeRemaining,
        retryCount: downloadProgress.retryCount,
        lastError: downloadProgress.lastError
      });

      console.log(`Updated playlist status for device ${token} to ${message.status}`);
    } catch (error) {
      console.error('Error handling playlist status:', error);
    }
  }

  async handleOnlineStatus(token, isOnline) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      // Check for active downloads when device comes online
      if (isOnline) {
        const activeDownload = await DownloadProgress.findOne({
          deviceToken: token,
          status: { $in: ['downloading', 'pending'] },
          lastUpdated: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
        });

        if (activeDownload) {
          console.log(`Found active download for device ${token}, resuming...`);
          
          // Send resume command to device with all necessary information
          this.wss.sendToDevice(token, {
            type: 'resumeDownload',
            data: {
              playlistId: activeDownload.playlistId,
              progress: activeDownload.progress,
              downloadedSongs: activeDownload.downloadedSongs,
              totalSongs: activeDownload.totalSongs,
              completedChunks: activeDownload.completedChunks || [],
              status: 'downloading'
            }
          });
        }
      }

      await device.updateStatus(isOnline);
      
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        isOnline: isOnline
      });
    } catch (error) {
      console.error('Error handling online status:', error);
    }
  }

  async handleDownloadProgress(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

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
          completedChunks: message.completedChunks,
          lastUpdated: new Date()
        },
        { new: true, upsert: true }
      );

      this.wss.broadcastToAdmins({
        type: 'downloadProgress',
        token: token,
        playlistId: message.playlistId,
        progress: downloadProgress.progress,
        downloadSpeed: downloadProgress.downloadSpeed,
        downloadedSongs: downloadProgress.downloadedSongs,
        totalSongs: downloadProgress.totalSongs,
        estimatedTimeRemaining: downloadProgress.estimatedTimeRemaining,
        status: 'downloading'
      });
    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }
}

module.exports = StatusHandler;