const WebSocket = require('ws');
const ConnectionHandler = require('./handlers/ConnectionHandler');
const PlaylistDeleteMessage = require('./messages/PlaylistDeleteMessage');

class WebSocketServer {
  constructor(server) {
    console.log('WebSocket sunucusu başlatılıyor...');
    this.wss = new WebSocket.Server({ server });
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
        await this.connectionHandler.handleAdminConnection(ws);
      } else {
        await this.connectionHandler.handleDeviceConnection(ws);
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