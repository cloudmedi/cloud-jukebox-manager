const Device = require('../../models/Device');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistStatus(token, message) {
    try {
      console.log('Handling playlist status update:', message, 'for device:', token);
      
      if (!token) {
        console.error('No device token provided in playlist status update');
        return;
      }

      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      // Playlist durumunu güncelle
      await Device.findByIdAndUpdate(device._id, {
        playlistStatus: message.status
      });

      // Admin paneline bildir
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playlistStatus: message.status,
        playlistId: message.playlistId
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