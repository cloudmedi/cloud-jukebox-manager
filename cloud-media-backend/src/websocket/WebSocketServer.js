const WebSocket = require('ws');
const MessageHandler = require('./handlers/MessageHandler');
const StatusHandler = require('./handlers/StatusHandler');
const AdminConnectionHandler = require('./handlers/AdminConnectionHandler');
const DeviceConnectionHandler = require('./handlers/DeviceConnectionHandler');
const Device = require('../models/Device');

class WebSocketServer {
  constructor(server) {
    console.log('WebSocket sunucusu başlatılıyor...');
    this.wss = new WebSocket.Server({ server });
    this.messageHandler = new MessageHandler(this);
    this.statusHandler = new StatusHandler(this);
    this.adminHandler = new AdminConnectionHandler(this);
    this.deviceHandler = new DeviceConnectionHandler(this);
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
        await this.adminHandler.handleConnection(ws);
      } else {
        await this.deviceHandler.handleConnection(ws);
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

  async handleDeviceMessage(token, message) {
    console.log(`Handling device message from ${token}:`, message);
    
    switch (message.type) {
      case 'status':
        await this.statusHandler.handleOnlineStatus(token, message.isOnline);
        break;

      case 'playlistStatus':
        await this.statusHandler.handlePlaylistStatus(token, message);
        break;

      case 'downloadProgress':
        await this.handleDownloadProgress(token, message);
        break;

      default:
        console.log('Unknown message type:', message.type);
        break;
    }
  }

  async handleDownloadProgress(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      console.log(`Processing progress update for device ${token}:`, message);

      // Update device progress
      const updatedDevice = await Device.findByIdAndUpdate(device._id, {
        downloadProgress: message.progress,
        playlistStatus: message.progress === 100 ? 'loaded' : 'loading'
      }, { new: true });

      console.log(`Updated device ${token} progress:`, updatedDevice);

      // Broadcast progress to admin clients
      this.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        downloadProgress: message.progress,
        playlistStatus: message.progress === 100 ? 'loaded' : 'loading'
      });

      console.log(`Progress broadcast sent for device ${token}: ${message.progress}%`);
    } catch (error) {
      console.error('Error handling download progress:', error);
    }
  }

  broadcastToAdmins(message) {
    console.log('Broadcasting to admins:', message);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        client.send(JSON.stringify(message));
        console.log('Message sent to admin client');
      }
    });
  }

  sendToDevice(token, message) {
    console.log(`Sending message to device ${token}:`, message);
    let sent = false;
    this.wss.clients.forEach(client => {
      if (client.deviceToken === token && client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
          sent = true;
          console.log(`Message successfully sent to device ${token}`);
        } catch (error) {
          console.error(`Error sending message to device ${token}:`, error);
        }
      }
    });
    
    if (!sent) {
      console.log(`Message could not be sent - Device ${token} not found or not connected`);
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