const Device = require('../../models/Device');

class DeviceConnectionHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleConnection(ws) {
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
            console.log(`Auth success response sent to device: ${deviceToken}`);

            this.setupMessageHandlers(ws, deviceToken, device);
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

  setupMessageHandlers(ws, deviceToken, device) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`Device message received from ${deviceToken}:`, data);
        await this.wss.handleDeviceMessage(deviceToken, data);
      } catch (error) {
        console.error(`Message handling error for device ${deviceToken}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', async () => {
      console.log(`Device disconnected: ${deviceToken}`);
      try {
        const device = await Device.findOne({ token: deviceToken });
        if (!device) {
          console.log(`Device ${deviceToken} not found - probably deleted`);
          return;
        }
        await device.updateStatus(false);

        this.wss.broadcastToAdmins({
          type: 'deviceStatus',
          token: deviceToken,
          isOnline: false
        });
      } catch (error) {
        // Hata durumunda sadece loglama yap, uygulamayı kapatma
        console.error(`Error updating device status on disconnect: ${error.message}`);
      }
    });
  }
}

module.exports = DeviceConnectionHandler;