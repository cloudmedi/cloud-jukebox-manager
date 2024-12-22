const WebSocket = require('ws');
const Device = require('../models/Device');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Token -> WebSocket mapping
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', async (ws) => {
      console.log('New client connected');

      // İlk mesajı bekle (authentication)
      ws.once('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth' && data.token) {
            // Cihazı doğrula
            const device = await Device.findOne({ token: data.token });
            
            if (device) {
              console.log(`Device authenticated: ${device.token}`);
              this.clients.set(device.token, ws);
              
              // Cihazı online olarak işaretle
              await device.updateStatus(true);
              
              // Client'a başarılı authentication bilgisi gönder
              ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
              
              // Disconnect olduğunda
              ws.on('close', async () => {
                console.log(`Device disconnected: ${device.token}`);
                this.clients.delete(device.token);
                await device.updateStatus(false);
              });

              // Mesajları dinle
              ws.on('message', async (message) => {
                try {
                  const data = JSON.parse(message);
                  await this.handleMessage(device.token, data);
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

  async handleMessage(token, message) {
    const ws = this.clients.get(token);
    if (!ws) return;

    switch (message.type) {
      case 'status':
        // Cihaz durum güncellemesi
        const device = await Device.findOne({ token });
        if (device) {
          await device.updateStatus(message.isOnline);
        }
        break;

      case 'volume':
        // Ses seviyesi güncellemesi
        const volumeDevice = await Device.findOne({ token });
        if (volumeDevice) {
          await volumeDevice.setVolume(message.volume);
        }
        break;

      // Diğer mesaj tipleri buraya eklenebilir
    }
  }

  // Admin panelden cihaza mesaj gönderme
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