const Device = require('../../models/Device');
const DownloadProgress = require('../../models/DownloadProgress');

class AdminConnectionHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleConnection(ws) {
    console.log('Admin client connected');
    ws.isAdmin = true;

    try {
      // Mevcut cihaz durumlarını gönder
      const devices = await Device.find({});
      const deviceStatuses = devices.map(device => ({
        type: 'deviceStatus',
        token: device.token,
        isOnline: device.isOnline,
        volume: device.volume
      }));

      // Aktif indirmelerin durumunu gönder
      const activeDownloads = await DownloadProgress.find({ 
        status: { $in: ['downloading', 'paused'] } 
      }).populate('deviceId', 'name token');

      ws.send(JSON.stringify({
        type: 'initialState',
        devices: deviceStatuses,
        downloads: activeDownloads
      }));

      console.log('Initial state sent to admin');
    } catch (error) {
      console.error('Error fetching initial states:', error);
    }

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.wss.messageHandler.handleAdminMessage(data, ws);
        console.log('Admin message handled:', data.type);
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

  // İndirme durumu güncellemelerini admin'e gönder
  broadcastDownloadProgress(progress) {
    this.wss.clients.forEach(client => {
      if (client.isAdmin) {
        client.send(JSON.stringify({
          type: 'downloadProgress',
          data: progress
        }));
      }
    });
  }
}

module.exports = AdminConnectionHandler;