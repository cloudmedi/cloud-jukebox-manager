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