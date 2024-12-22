const WebSocket = require('ws');
const Device = require('../models/Device');
const ChannelManager = require('./ChannelManager');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.channelManager = new ChannelManager();
    this.heartbeatInterval = 30000; // 30 saniye
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', async (ws, req) => {
      console.log('New WebSocket connection attempt');

      // Heartbeat mekanizması
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      if (req.url === '/admin') {
        this.handleAdminConnection(ws);
      } else {
        this.handleDeviceConnection(ws);
      }
    });

    // Heartbeat kontrolü
    this.startHeartbeat();
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          console.log('Client terminated due to heartbeat failure');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, this.heartbeatInterval);
  }

  async handleAdminConnection(ws) {
    console.log('Admin client connected');
    this.channelManager.joinChannel('admin', 'admin-' + Date.now(), ws);

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

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Admin message received:', data);

        if (data.type === 'command') {
          console.log('Sending command to device:', data.token);
          const success = this.channelManager.sendToClient(data.token, data);

          ws.send(JSON.stringify({
            type: 'commandStatus',
            token: data.token,
            command: data.command,
            success: success
          }));
        }
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
      this.channelManager.leaveAllChannels('admin');
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
            console.log(`Device authenticated: ${deviceToken}`);

            // Cihazı kanallara ekle
            this.channelManager.joinChannel('devices', deviceToken, ws);
            this.channelManager.joinChannel(`device-${deviceToken}`, deviceToken, ws);

            await device.updateStatus(true);

            // Admin'lere cihaz durumunu bildir
            this.channelManager.broadcastToChannel('admin', {
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

            ws.on('message', async (message) => {
              try {
                const data = JSON.parse(message);
                console.log('Device message received:', data);
                await this.handleDeviceMessage(deviceToken, data);
              } catch (error) {
                console.error('Message handling error:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: error.message
                }));
              }
            });

            ws.on('close', async () => {
              console.log(`Device disconnected: ${deviceToken}`);
              await device.updateStatus(false);
              this.channelManager.leaveAllChannels(deviceToken);

              this.channelManager.broadcastToChannel('admin', {
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

  async handleDeviceMessage(token, message) {
    console.log(`Handling device message from ${token}:`, message);
    const device = await Device.findOne({ token });
    if (!device) return;

    switch (message.type) {
      case 'status':
        await device.updateStatus(message.isOnline);
        this.channelManager.broadcastToChannel('admin', {
          type: 'deviceStatus',
          token: token,
          isOnline: message.isOnline
        });
        break;

      case 'volume':
        await device.setVolume(message.volume);
        this.channelManager.broadcastToChannel('admin', {
          type: 'deviceStatus',
          token: token,
          volume: message.volume
        });
        break;

      case 'error':
        this.channelManager.broadcastToChannel('admin', {
          type: 'deviceError',
          token: token,
          error: message.error
        });
        break;
    }
  }

  sendToDevice(token, message) {
    return this.channelManager.sendToClient(token, message);
  }
}

module.exports = WebSocketServer;