const WebSocket = require('ws');
const Device = require('../models/Device');
const MessageHandler = require('./handlers/MessageHandler');
const StatusHandler = require('./handlers/StatusHandler');

class WebSocketServer {
  constructor(server) {
    console.log('WebSocket sunucusu başlatılıyor...');
    this.wss = new WebSocket.Server({ server });
    this.messageHandler = new MessageHandler(this);
    this.statusHandler = new StatusHandler(this);
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', async (ws, req) => {
      console.log('New WebSocket connection attempt');

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
    }, 30000);
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

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.messageHandler.handleAdminMessage(data, ws);
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

            this.broadcastToAdmins({
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

              this.broadcastToAdmins({
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

  async handlePlaylistDeletion(playlistId) {
    console.log('Broadcasting playlist deletion:', playlistId);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('Sending deletion message to client');
        client.send(JSON.stringify({
          type: 'playlist',
          action: 'deleted',
          playlistId: playlistId
        }));
      }
    });
  }

  async handleDeviceMessage(token, message) {
    console.log(`Handling device message from ${token}:`, message);
    
    switch (message.type) {
      case 'status':
        await this.statusHandler.handleOnlineStatus(token, message.isOnline);
        break;

      case 'playlistStatus':
        await this.statusHandler.handlePlaylistStatus(token, message);
        break;

      case 'playbackStatus':
        this.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          isPlaying: message.status === 'playing'
        });
        break;

      case 'volume':
        const device = await Device.findOne({ token });
        if (!device) return;

        await device.setVolume(message.volume);
        this.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          volume: message.volume
        });
        break;

      case 'error':
        this.broadcastToAdmins({
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

  broadcastToAdmins(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        client.send(JSON.stringify(message));
      }
    });
  }

  sendToDevice(token, message) {
    console.log(`Cihaza mesaj gönderiliyor - Token: ${token}`, message);
    let sent = false;
    this.wss.clients.forEach(client => {
      if (client.deviceToken === token && client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
          sent = true;
          console.log(`Mesaj başarıyla gönderildi - Token: ${token}`);
        } catch (error) {
          console.error(`Mesaj gönderme hatası - Token: ${token}:`, error);
        }
      }
    });
    
    if (!sent) {
      console.log(`Mesaj gönderilemedi - Token: ${token} - Cihaz bulunamadı veya bağlı değil`);
    }
    
    return sent;
  }

  findDeviceWebSocket(token) {
    let targetWs = null;
    this.wss.clients.forEach(client => {
      if (client.deviceToken === token) {
        targetWs = client;
      }
    });
    return targetWs;
  }
}

module.exports = WebSocketServer;
