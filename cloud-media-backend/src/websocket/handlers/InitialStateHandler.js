const Device = require('../../models/Device');

class InitialStateHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleInitialState(ws) {
    try {
      const devices = await Device.find({}).populate('activePlaylist');
      const deviceStatuses = devices.map(device => ({
        type: 'deviceStatus',
        token: device.token,
        isOnline: device.isOnline,
        volume: device.volume,
        activePlaylist: device.activePlaylist,
        playlistStatus: device.playlistStatus
      }));

      ws.send(JSON.stringify({
        type: 'initialState',
        devices: deviceStatuses
      }));

      console.log('Initial state sent to admin');
    } catch (error) {
      console.error('Error fetching initial device states:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to fetch initial state'
      }));
    }
  }
}

module.exports = InitialStateHandler;