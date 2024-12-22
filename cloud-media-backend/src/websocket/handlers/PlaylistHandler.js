const PlaylistMessage = require('../messages/PlaylistMessage');
const Device = require('../../models/Device');

class PlaylistHandler {
  constructor(channelManager) {
    this.channelManager = channelManager;
  }

  async sendPlaylistToDevices(playlist, deviceIds) {
    const message = PlaylistMessage.create(playlist);
    
    for (const deviceId of deviceIds) {
      const device = await Device.findById(deviceId);
      if (device) {
        this.channelManager.sendToClient(device.token, message);
      }
    }
  }

  async sendPlaylistToGroups(playlist, groupIds) {
    const Device = require('../../models/Device');
    
    for (const groupId of groupIds) {
      const devices = await Device.find({ groupId });
      await this.sendPlaylistToDevices(playlist, devices.map(d => d._id));
    }
  }
}

module.exports = PlaylistHandler;