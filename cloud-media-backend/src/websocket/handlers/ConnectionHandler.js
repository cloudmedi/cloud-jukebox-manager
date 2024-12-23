const Device = require('../../models/Device');

class ConnectionHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleDeviceAuth(ws, data) {
    try {
      console.log('Device auth attempt:', data);
      const device = await Device.findOne({ token: data.token }).populate('activePlaylist');
      
      if (!device) {
        console.log('Invalid token received:', data.token);
        ws.send(JSON.stringify({
          type: 'auth',
          status: 'error',
          message: 'Invalid token'
        }));
        ws.close();
        return null;
      }

      ws.deviceToken = device.token;
      console.log(`Device authenticated: ${device.token}`);
      
      await device.updateStatus(true);
      
      // Send device info including active playlist
      ws.send(JSON.stringify({
        type: 'auth',
        status: 'success',
        deviceInfo: {
          name: device.name,
          volume: device.volume,
          activePlaylist: device.activePlaylist
        }
      }));

      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: device.token,
        isOnline: true,
        volume: device.volume,
        activePlaylist: device.activePlaylist,
        playlistStatus: device.playlistStatus
      });

      return device;
    } catch (error) {
      console.error('Authentication error:', error);
      ws.close();
      return null;
    }
  }
}

module.exports = ConnectionHandler;