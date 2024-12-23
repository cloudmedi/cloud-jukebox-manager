class DeviceMessageHandler {
  constructor(wss, statusHandler) {
    this.wss = wss;
    this.statusHandler = statusHandler;
  }

  async handleMessage(token, message) {
    console.log(`Handling device message from ${token}:`, message);
    
    switch (message.type) {
      case 'status':
        await this.statusHandler.handleOnlineStatus(token, message.isOnline);
        break;

      case 'playbackStatus':
        await this.statusHandler.handlePlaybackStatus(token, message);
        break;

      case 'playlistStatus':
        await this.statusHandler.handlePlaylistStatus(token, message);
        break;

      case 'volume':
        await this.handleVolumeUpdate(token, message);
        break;

      case 'error':
        this.wss.broadcastToAdmins({
          type: 'deviceError',
          token: token,
          error: message.error
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
        break;
    }
  }

  async handleVolumeUpdate(token, message) {
    const Device = require('../../models/Device');
    const device = await Device.findOne({ token });
    if (!device) return;

    await device.setVolume(message.volume);
    this.wss.broadcastToAdmins({
      type: 'deviceStatus',
      token: token,
      volume: message.volume
    });
  }
}

module.exports = DeviceMessageHandler;