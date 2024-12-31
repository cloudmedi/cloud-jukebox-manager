const Device = require('../../models/Device');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaybackStatus(token, status) {
    try {
      console.log(`Handling playback status for device ${token}:`, status);
      
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      await Device.findByIdAndUpdate(device._id, {
        playbackStatus: status,
        isPlaying: status === 'playing'
      });

      // Badge durumu için detaylı bilgi
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playbackStatus: status,
        isPlaying: status === 'playing',
        badgeStatus: this.getBadgeStatus(status)
      });

      console.log(`Updated playback status for device ${token} to ${status}`);
    } catch (error) {
      console.error('Error handling playback status:', error);
    }
  }

  async handlePlaylistStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      await Device.findByIdAndUpdate(device._id, {
        playlistStatus: message.status
      });

      // Badge durumu için ek bilgi ekleyelim
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playlistStatus: message.status,
        playlistId: message.playlistId,
        badgeStatus: message.status === 'error' ? 'error' : 'success'
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
      
      // Badge durumu için online/offline bilgisi
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        isOnline: isOnline,
        badgeStatus: isOnline ? 'online' : 'offline'
      });
    } catch (error) {
      console.error('Error handling online status:', error);
    }
  }

  getBadgeStatus(status) {
    switch (status) {
      case 'playing':
        return 'playing';
      case 'paused':
        return 'paused';
      case 'error':
        return 'error';
      default:
        return 'offline';
    }
  }
}

module.exports = StatusHandler;
