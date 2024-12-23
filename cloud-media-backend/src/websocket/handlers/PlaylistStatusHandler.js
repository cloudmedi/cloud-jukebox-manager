const Device = require('../../models/Device');

class PlaylistStatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistStatus(token, status) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error(`Device not found for token: ${token}`);
        return;
      }

      device.playlistStatus = status;
      await device.save();

      // Broadcast the updated status to all admin clients
      this.wss.clients.forEach(client => {
        if (client.isAdmin && client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'deviceStatus',
            token: token,
            playlistStatus: status
          }));
        }
      });

      console.log(`Updated playlist status for device ${token} to ${status}`);
    } catch (error) {
      console.error('Error updating playlist status:', error);
    }
  }
}

module.exports = PlaylistStatusHandler;