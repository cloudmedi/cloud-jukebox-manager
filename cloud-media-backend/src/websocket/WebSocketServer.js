const WebSocket = require('ws');
const Device = require('../models/Device');
const MessageHandler = require('./handlers/MessageHandler');
const InitialStateHandler = require('./handlers/InitialStateHandler');
const ConnectionHandler = require('./handlers/ConnectionHandler');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.messageHandler = new MessageHandler(this);
    this.initialStateHandler = new InitialStateHandler(this);
    this.connectionHandler = new ConnectionHandler(this);
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
    await this.initialStateHandler.handleInitialState(ws);

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
    ws.once('message', async (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'auth' && data.token) {
          const device = await this.connectionHandler.handleDeviceAuth(ws, data);
          
          if (device) {
            ws.on('message', async (message) => {
              try {
                const data = JSON.parse(message);
                console.log('Device message received:', data);
                await this.messageHandler.handleDeviceMessage(device.token, data);
              } catch (error) {
                console.error('Message handling error:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: error.message
                }));
              }
            });

            ws.on('close', async () => {
              console.log(`Device disconnected: ${device.token}`);
              await device.updateStatus(false);
              this.broadcastToAdmins({
                type: 'deviceStatus',
                token: device.token,
                isOnline: false
              });
            });
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        ws.close();
      }
    });
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