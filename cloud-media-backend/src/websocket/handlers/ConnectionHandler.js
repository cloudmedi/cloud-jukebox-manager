const WebSocket = require('ws');
const Device = require('../../models/Device');

class ConnectionHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleAdminConnection(ws) {
    console.log('Admin client connected');
    ws.isAdmin = true;

    try {
      const devices = await Device.find({});
      const deviceStatuses = devices.map(device => ({
        type: 'deviceStatus',
        token: device.token,
        isOnline: device.isOnline,
        volume: device.volume,
        playlistStatus: device.playlistStatus
      }));

      ws.send(JSON.stringify({
        type: 'initialState',
        devices: deviceStatuses
      }));
    } catch (error) {
      console.error('Error fetching initial device states:', error);
    }

    ws.on('close', () => {
      console.log('Admin client disconnected');
    });
  }

  async handleDeviceConnection(ws, token) {
    try {
      const device = await Device.findOne({ token });

      if (device) {
        ws.deviceToken = token;
        console.log(`Device authenticated: ${token}`);

        await device.updateStatus(true);
        this.broadcastDeviceStatus(device);

        ws.send(JSON.stringify({
          type: 'auth',
          status: 'success',
          deviceInfo: {
            name: device.name,
            volume: device.volume
          }
        }));

        return true;
      }
    } catch (error) {
      console.error('Device authentication error:', error);
    }
    return false;
  }

  broadcastDeviceStatus(device) {
    this.wss.clients.forEach(client => {
      if (client.isAdmin && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'deviceStatus',
          token: device.token,
          isOnline: device.isOnline,
          volume: device.volume,
          playlistStatus: device.playlistStatus
        }));
      }
    });
  }
}

module.exports = ConnectionHandler;