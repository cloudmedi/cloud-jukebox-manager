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
      console.log('New WebSocket connection attempt');

      // Admin bağlantısı kontrolü
      if (req.url === '/admin') {
        console.log('Admin client connected');
        this.adminClients.add(ws);
        
        // Mevcut cihaz durumlarını gönder
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

        ws.on('close', () => {
          console.log('Admin client disconnected');
          this.adminClients.delete(ws);
        });

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            console.log('Admin message received:', data);
            
            if (data.type === 'command') {
              console.log('Sending command to device:', data.token);
              const success = this.sendToDevice(data.token, data);
              
              // Komut durumunu admin'e bildir
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

        return;
      }

      // Normal cihaz bağlantısı
      ws.once('message', async (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Device auth attempt:', data);
          
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
                isOnline: true,
                volume: device.volume
              });
              
              // Client'a başarılı authentication bilgisi gönder
              ws.send(JSON.stringify({ 
                type: 'auth', 
                status: 'success',
                deviceInfo: {
                  name: device.name,
                  volume: device.volume
                }
              }));
              
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
                  console.log('Device message received:', data);
                  await this.handleDeviceMessage(device.token, data);
                } catch (error) {
                  console.error('Message handling error:', error);
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: error.message
                  }));
                }
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
    });
  }

  async handleDeviceMessage(token, message) {
    console.log(`Handling device message from ${token}:`, message);
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

      case 'error':
        this.broadcastToAdmins({
          type: 'deviceError',
          token: token,
          error: message.error
        });
        break;
    }
  }

  broadcastToAdmins(message) {
    console.log('Broadcasting to admins:', message);
    this.adminClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  sendToDevice(token, message) {
    console.log(`Sending message to device ${token}:`, message);
    const ws = this.clients.get(token);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    console.log(`Device ${token} not found or not connected`);
    return false;
  }
}

module.exports = WebSocketServer;