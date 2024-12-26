const Device = require('../../models/Device');

class AdminConnectionHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleConnection(ws) {
    console.log('Admin client connected');
    ws.isAdmin = true;

    try {
      const devices = await Device.find({});
      const deviceStatuses = devices.map(device => ({
        type: 'deviceStatus',
        token: device.token,
        isOnline: device.isOnline,
        volume: device.volume
      }));

      ws.send(JSON.stringify({
        type: 'initialState',
        devices: deviceStatuses
      }));
      console.log('Initial state sent to admin');
    } catch (error) {
      console.error('Error fetching initial device states:', error);
    }

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.wss.messageHandler.handleAdminMessage(data, ws);
        console.log('Admin message handled:', data.type);
      } catch (error) {
        console.error('Admin message handling error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('Admin client disconnected');
    });
  }
}

module.exports = AdminConnectionHandler;