const Device = require('../../models/Device');
const DeviceGroup = require('../../models/DeviceGroup');

class PlaylistHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleSendPlaylist(message) {
    try {
      const { playlist, devices, groups } = message;
      const targetDevices = new Set(devices);

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

      for (const deviceId of targetDevices) {
        const device = await Device.findById(deviceId);
        if (device && device.token) {
          const deviceWs = this.wss.findDeviceWebSocket(device.token);
          
          if (deviceWs) {
            await Device.findByIdAndUpdate(deviceId, {
              activePlaylist: playlist._id,
              playlistStatus: 'loading',
              downloadProgress: 0
            });

            deviceWs.send(JSON.stringify({
              type: 'playlist',
              data: {
                ...playlist,
                baseUrl: process.env.BASE_URL || 'http://localhost:5000'
              }
            }));

            console.log(`Playlist sent to device: ${device.token}`);
          } else {
            await Device.findByIdAndUpdate(deviceId, {
              playlistStatus: 'error',
              downloadProgress: 0
            });
            console.log(`Device not connected: ${device.token}`);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending playlist:', error);
      return false;
    }
  }

  async handlePlaylistStatus(message, deviceToken) {
    try {
      console.log('Handling playlist status update:', message, 'for device:', deviceToken);
      
      const { status, progress } = message;
      const device = await Device.findOne({ token: deviceToken });
      
      if (device) {
        await Device.findByIdAndUpdate(device._id, {
          playlistStatus: status,
          downloadProgress: progress || 0
        });
        
        console.log(`Updated playlist status for device ${deviceToken} to ${status} with progress ${progress || 0}%`);
      } else {
        console.error('Device not found for token:', deviceToken);
      }
    } catch (error) {
      console.error('Error updating playlist status:', error);
    }
  }
}

module.exports = PlaylistHandler;