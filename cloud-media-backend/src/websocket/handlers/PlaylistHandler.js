const Playlist = require('../../models/Playlist');
const Device = require('../../models/Device');
const DeviceGroup = require('../../models/DeviceGroup');

class PlaylistHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleSendPlaylist(message) {
    try {
      const { playlist, devices, groups } = message;

      // Hedef cihazları topla
      const targetDevices = new Set(devices);

      // Grup içindeki cihazları ekle
      if (groups && groups.length > 0) {
        const deviceGroups = await DeviceGroup.find({
          _id: { $in: groups }
        }).populate('devices');

        deviceGroups.forEach(group => {
          group.devices.forEach(device => {
            targetDevices.add(device._id.toString());
          });
        });
      }

      // Her cihaza playlist'i gönder
      for (const deviceId of targetDevices) {
        const device = await Device.findById(deviceId);
        if (device && device.token) {
          // Cihaza özel WebSocket bağlantısını bul
          const deviceWs = this.wss.findDeviceWebSocket(device.token);
          
          if (deviceWs) {
            // Playlist'i cihaza gönder
            deviceWs.send(JSON.stringify({
              type: 'playlist',
              data: {
                ...playlist,
                baseUrl: 'http://localhost:5000' // Şarkı dosyalarının indirileceği base URL
              }
            }));

            // Device'ın aktif playlist'ini güncelle
            await Device.findByIdAndUpdate(deviceId, {
              activePlaylist: playlist._id,
              playlistStatus: 'loading'
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Playlist gönderme hatası:', error);
      return false;
    }
  }
}

module.exports = PlaylistHandler;