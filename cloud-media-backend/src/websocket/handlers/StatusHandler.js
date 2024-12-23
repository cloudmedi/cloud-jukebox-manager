const Device = require('../../models/Device');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaybackStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      // Admin paneline bildir
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        isPlaying: message.status === 'playing'
      });

      console.log(`Updated playback status for device ${token} to ${message.status}`);
    } catch (error) {
      console.error('Error handling playback status:', error);
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

  async handlePlaylistStatus(token, message) {
    try {
      console.log('Handling playlist status update:', message, 'for device:', token);
      
      const { status, playlistId } = message;
      const device = await Device.findOne({ token });
      
      if (device) {
        await Device.findByIdAndUpdate(device._id, {
          playlistStatus: status
        });
        
        this.wss.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          playlistStatus: status
        });
        
        console.log(`Updated playlist status for device ${token} to ${status}`);
      } else {
        console.error('Device not found for token:', token);
      }
    } catch (error) {
      console.error('Error updating playlist status:', error);
    }
  }
}

module.exports = StatusHandler;