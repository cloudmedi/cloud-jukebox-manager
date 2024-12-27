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
        downloadProgress: message.progress || 0
      });

      // Admin paneline bildir
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playlistStatus: message.status,
        downloadProgress: message.progress || 0,
        playlistId: message.playlistId
      });

      console.log(`Updated playlist status for device ${token} to ${message.status} with progress ${message.progress || 0}%`);
    } catch (error) {
      console.error('Error handling playlist status:', error);
    }
  }

  async handleDownloadProgress(token, progress) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      // İndirme durumunu güncelle
      await Device.findByIdAndUpdate(device._id, {
        downloadProgress: progress
      });

      // Admin paneline bildir
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        downloadProgress: progress
      });

      console.log(`Updated download progress for device ${token}: ${progress}%`);
    } catch (error) {
      console.error('Error handling download progress:', error);
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