const Device = require('../../models/Device');

class DeviceConnectionHandler {
  constructor(wss) {
    this.wss = wss;
    this.connectedDevices = new Map();
  }

  async handleConnection(ws) {
    console.log('[WebSocket] New device connection attempt');

    ws.once('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('[WebSocket] Received message from device:', data);

        if (data.type === 'auth' && data.token) {
          let deviceToken = data.token;
          console.log('[WebSocket] Device registration attempt with token:', deviceToken);

          const device = await Device.findOne({ token: deviceToken });
          if (device) {
            ws.deviceToken = deviceToken;
            console.log(`[WebSocket] Device authenticated successfully: ${deviceToken}`);

            await device.updateStatus(true);

            ws.send(JSON.stringify({
              type: 'auth',
              success: true,
              token: deviceToken,
              data: {
                name: device.name,
                type: device.type,
                volume: device.volume
              }
            }));
            console.log(`[WebSocket] Auth success response sent to device: ${deviceToken}`);

            this.connectedDevices.set(deviceToken, { ws, device });
            this.setupMessageHandlers(ws, deviceToken, device);
          } else {
            console.log('[WebSocket] Invalid device token received:', deviceToken);
            ws.send(JSON.stringify({
              type: 'auth',
              success: false,
              message: 'Invalid device token'
            }));
            ws.close();
          }
        } else {
          console.log('[WebSocket] Invalid auth message received');
          ws.close();
        }
      } catch (error) {
        console.error('[WebSocket] Error handling device message:', error);
        ws.close();
      }
    });

    ws.on('close', async () => {
      const deviceToken = ws.deviceToken;
      console.log('[WebSocket] Device connection closed:', deviceToken);
      
      if (deviceToken) {
        try {
          const device = await Device.findOne({ token: deviceToken });
          if (device) {
            await device.updateStatus(false);
            console.log(`[WebSocket] Device ${deviceToken} status updated to offline`);

            this.wss.broadcastToAdmins({
              type: 'deviceStatus',
              token: deviceToken,
              isOnline: false
            });
          }
          this.connectedDevices.delete(deviceToken);
        } catch (error) {
          console.error('[WebSocket] Error updating device status on disconnect:', error);
        }
      }
    });
  }

  setupMessageHandlers(ws, deviceToken, device) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`[WebSocket] Device message received from ${deviceToken}:`, data);
        
        await this.wss.handleDeviceMessage(deviceToken, data);
      } catch (error) {
        console.error(`[WebSocket] Message handling error for device ${deviceToken}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });
  }

  async sendScheduleToDevice(deviceId, schedule) {
    console.log(`[WebSocket] Sending schedule to device ${deviceId}:`, schedule);
    const device = this.connectedDevices.get(deviceId);
    if (device && device.ws.readyState === WebSocket.OPEN) {
      try {
        device.ws.send(JSON.stringify({
          type: 'schedule-created',
          data: {
            id: schedule._id,
            playlist: schedule.playlist,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            repeatType: schedule.repeatType
          }
        }));
        console.log(`[WebSocket] Schedule sent successfully to device ${deviceId}`);
        return true;
      } catch (error) {
        console.error(`[WebSocket] Error sending schedule to device ${deviceId}:`, error);
        return false;
      }
    }
    console.log(`[WebSocket] Device ${deviceId} not connected or not ready`);
    return false;
  }

  async sendMessageToDevice(deviceId, message) {
    const device = this.connectedDevices.get(deviceId);
    if (device && device.ws.readyState === WebSocket.OPEN) {
      device.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}

module.exports = DeviceConnectionHandler;