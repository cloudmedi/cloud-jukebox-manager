const WebSocket = require('ws');
const MessageHandler = require('./handlers/MessageHandler');
const StatusHandler = require('./handlers/StatusHandler');
const AdminConnectionHandler = require('./handlers/AdminConnectionHandler');
const DeviceConnectionHandler = require('./handlers/DeviceConnectionHandler');

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
      
      // Heartbeat mekanizması
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
        console.log('Heartbeat received from client');
      });

      // Admin veya device bağlantısı
      if (req.url === '/admin') {
        console.log('Admin connection attempt');
        await this.adminHandler.handleConnection(ws);
      } else {
        console.log('Device connection attempt');
        await this.deviceHandler.handleConnection(ws);
      }
    });

    this.startHeartbeat();
  }

  startHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          console.log('Terminating inactive client');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  broadcastToAdmins(message) {
    console.log('Broadcasting to admins:', message);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        try {
          client.send(JSON.stringify(message));
          console.log('Message sent to admin client');
        } catch (error) {
          console.error('Error sending message to admin:', error);
        }
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
      console.log(`Device ${token} not found or not connected`);
    }
    
    return sent;
  }
}

module.exports = WebSocketServer;