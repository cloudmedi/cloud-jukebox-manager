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
        volume: device.volume
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

  async handleDeviceConnection(ws) {
    let deviceToken = null;

    ws.once('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Device auth attempt:', data);

        if (data.type === 'auth' && data.token) {
          const device = await Device.findOne({ token: data.token });

          if (device) {
            deviceToken = device.token;
            ws.deviceToken = deviceToken;
            console.log(`Device authenticated: ${deviceToken}`);

            await device.updateStatus(true);

            this.wss.broadcastToAdmins({
              type: 'deviceStatus',
              token: deviceToken,
              isOnline: true,
              volume: device.volume
            });

            ws.send(JSON.stringify({
              type: 'auth',
              status: 'success',
              deviceInfo: {
                name: device.name,
                volume: device.volume
              }
            }));

            ws.on('close', async () => {
              console.log(`Device disconnected: ${deviceToken}`);
              await device.updateStatus(false);

              this.wss.broadcastToAdmins({
                type: 'deviceStatus',
                token: deviceToken,
                isOnline: false
              });
            });
          } else {
            console.log('Invalid token received:', data.token);
            ws.send(JSON.stringify({
              type: 'auth',
              status: 'error',
              message: 'Invalid token'
            }));
            ws.close();
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        ws.close();
      }
    });
  }
}

module.exports = ConnectionHandler;