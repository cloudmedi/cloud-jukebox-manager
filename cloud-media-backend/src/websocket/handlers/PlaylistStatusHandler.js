const Device = require('../../models/Device');

class PlaylistStatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistStatus(message, deviceToken) {
    try {
      console.log('Handling playlist status update:', message, 'for device:', deviceToken);
      
      const { status, playlistId } = message;
      const device = await Device.findOne({ token: deviceToken });
      
      if (device) {
        await Device.findByIdAndUpdate(device._id, {
          playlistStatus: status,
          activePlaylist: playlistId
        });
        
        // Admins'e durum güncellemesini bildir
        this.wss.broadcastToAdmins({
          type: 'deviceStatus',
          token: deviceToken,
          playlistStatus: status,
          activePlaylist: playlistId
        });
        
        console.log(`Updated playlist status for device ${deviceToken} to ${status}`);
      }
    } catch (error) {
      console.error('Error updating playlist status:', error);
    }
  }
}

module.exports = PlaylistStatusHandler;