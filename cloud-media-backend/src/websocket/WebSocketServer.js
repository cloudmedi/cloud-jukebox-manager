const WebSocket = require('ws');
const Device = require('../models/Device');
const ConnectionHandler = require('./handlers/ConnectionHandler');
const PlaylistStatusHandler = require('./handlers/PlaylistStatusHandler');
const MessageHandler = require('./handlers/MessageHandler');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.connectionHandler = new ConnectionHandler(this.wss);
    this.playlistStatusHandler = new PlaylistStatusHandler(this.wss);
    this.messageHandler = new MessageHandler(this);
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
        await this.connectionHandler.handleAdminConnection(ws);
        this.setupAdminMessageHandlers(ws);
      } else {
        this.setupDeviceAuthHandler(ws);
      }
    });

    this.startHeartbeat();
  }

  setupAdminMessageHandlers(ws) {
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
  }

  setupDeviceAuthHandler(ws) {
    ws.once('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Device auth attempt:', data);

        if (data.type === 'auth' && data.token) {
          const authenticated = await this.connectionHandler.handleDeviceConnection(ws, data.token);
          
          if (authenticated) {
            this.setupDeviceMessageHandlers(ws, data.token);
          } else {
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

  setupDeviceMessageHandlers(ws, token) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Device message received:', data);

        if (data.type === 'playlistStatus') {
          await this.playlistStatusHandler.handlePlaylistStatus(token, data.status);
        }
      } catch (error) {
        console.error('Message handling error:', error);
      }
    });

    ws.on('close', async () => {
      console.log(`Device disconnected: ${token}`);
      const device = await Device.findOne({ token });
      if (device) {
        await device.updateStatus(false);
        this.connectionHandler.broadcastDeviceStatus(device);
      }
    });
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

  broadcastToAdmins(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        client.send(JSON.stringify(message));
      }
    });
  }

  sendToDevice(token, message) {
    let sent = false;
    this.wss.clients.forEach(client => {
      if (client.deviceToken === token && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        sent = true;
      }
    });
    return sent;
  }
}

module.exports = WebSocketServer;