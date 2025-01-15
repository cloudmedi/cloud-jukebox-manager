const Device = require('../../models/Device');

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

      // Playlist durumunu güncelle
      await Device.findByIdAndUpdate(device._id, {
        playlistStatus: message.status,
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
        downloadProgress: message.progress || 0,
        downloadSpeed: message.speed || 0,
        downloadedSongs: message.downloadedSongs || 0,
        totalSongs: message.totalSongs || 0,
        estimatedTimeRemaining: message.estimatedTimeRemaining || 0,
        retryCount: message.retryCount || 0,
        lastError: message.error
      });

      console.log(`Updated playlist status for device ${token} to ${message.status}`);
    } catch (error) {
      console.error('Error handling playlist status:', error);
    }
  }

  async handleDownloadProgress(message, device) {
    try {
      // Playlist durumunu güncelle
      await Device.findByIdAndUpdate(device._id, {
        playlistStatus: message.data.status,
        downloadProgress: {
          playlistId: message.data.playlistId,
          totalSongs: message.data.totalSongs,
          completedSongs: message.data.completedSongs,
          currentSong: message.data.songProgress,
          progress: message.data.progress
        }
      });

      // Admin paneline yeni format ile bildir
      this.wss.broadcastToAdmins({
        type: 'deviceDownloadProgress',
        deviceToken: device.token,
        playlistId: message.data.playlistId,
        totalSongs: message.data.totalSongs,
        completedSongs: message.data.completedSongs,
        status: message.data.status,
        songProgress: message.data.songProgress,
        progress: message.data.progress
      });

      console.info(`Device ${device._id} download progress updated: ${message.data.completedSongs}/${message.data.totalSongs} songs`);
    } catch (error) {
      console.error('Error handling download progress:', error);
      throw error;
    }
  }

  async handleOnlineStatus(token, isOnline) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

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
}

module.exports = StatusHandler;