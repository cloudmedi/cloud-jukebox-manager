const WebSocket = require('ws');
const Device = require('../models/Device');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Token -> WebSocket mapping
    this.adminClients = new Set(); // Admin WebSocket connections
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', async (ws, req) => {
      console.log('New client connected');

      // Admin bağlantısı kontrolü
      if (req.url === '/admin') {
        console.log('Admin client connected');
        this.adminClients.add(ws);
        
        ws.on('close', () => {
          console.log('Admin client disconnected');
          this.adminClients.delete(ws);
        });

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            if (data.type === 'command') {
              // Komutu ilgili cihaza ilet
              this.sendToDevice(data.token, data);
            }
          } catch (error) {
            console.error('Admin message handling error:', error);
          }
        });

        return;
      }

      // Normal cihaz bağlantısı
      ws.once('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth' && data.token) {
            const device = await Device.findOne({ token: data.token });
            
            if (device) {
              console.log(`Device authenticated: ${device.token}`);
              this.clients.set(device.token, ws);
              
              // Cihazı online olarak işaretle
              await device.updateStatus(true);
              
              // Admin'lere cihaz durumunu bildir
              this.broadcastToAdmins({
                type: 'deviceStatus',
                token: device.token,
                isOnline: true
              });
              
              // Client'a başarılı authentication bilgisi gönder
              ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
              
              // Disconnect olduğunda
              ws.on('close', async () => {
                console.log(`Device disconnected: ${device.token}`);
                this.clients.delete(device.token);
                await device.updateStatus(false);
                
                // Admin'lere cihaz durumunu bildir
                this.broadcastToAdmins({
                  type: 'deviceStatus',
                  token: device.token,
                  isOnline: false
                });
              });

              // Mesajları dinle
              ws.on('message', async (message) => {
                try {
                  const data = JSON.parse(message);
                  await this.handleDeviceMessage(device.token, data);
                } catch (error) {
                  console.error('Message handling error:', error);
                }
              });
            } else {
              // Geçersiz token
              ws.send(JSON.stringify({ type: 'auth', status: 'error', message: 'Invalid token' }));
              ws.close();
            }
          }
        } catch (error) {
          console.error('Authentication error:', error);
          ws.close();
        }
      });
    });
  }

  async handleDeviceMessage(token, message) {
    const device = await Device.findOne({ token });
    if (!device) return;

    switch (message.type) {
      case 'status':
        await device.updateStatus(message.isOnline);
        this.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          isOnline: message.isOnline
        });
        break;

      case 'volume':
        await device.setVolume(message.volume);
        this.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          volume: message.volume
        });
        break;
    }
  }

  // Admin'lere mesaj gönderme
  broadcastToAdmins(message) {
    this.adminClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Cihaza mesaj gönderme
  sendToDevice(token, message) {
    const ws = this.clients.get(token);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Broadcast mesaj gönderme (tüm cihazlara)
  broadcast(message) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

module.exports = WebSocketServer;