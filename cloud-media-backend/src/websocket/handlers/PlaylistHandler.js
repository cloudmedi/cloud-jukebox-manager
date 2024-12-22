const Playlist = require('../../models/Playlist');
const Device = require('../../models/Device');
const DeviceGroup = require('../../models/DeviceGroup');

class PlaylistHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleSendPlaylist(message) {
    try {
      // Playlist'i tüm detaylarıyla birlikte al
      const playlist = await Playlist.findById(message.playlist)
        .populate({
          path: 'songs',
          select: 'name artist filePath duration'
        });

      if (!playlist) {
        throw new Error('Playlist bulunamadı');
      }

      // Seçilen cihazlara gönder
      for (const deviceId of message.devices) {
        const device = await Device.findById(deviceId);
        if (device && device.token) {
          this.wss.sendToDevice(device.token, {
            type: 'playlist',
            playlist: {
              _id: playlist._id,
              name: playlist.name,
              songs: playlist.songs.map(song => ({
                _id: song._id,
                name: song.name,
                artist: song.artist,
                filePath: song.filePath,
                duration: song.duration
              }))
            }
          });
        }
      }

      // Seçilen gruplardaki cihazlara gönder
      for (const groupId of message.groups) {
        const group = await DeviceGroup.findById(groupId)
          .populate('devices');
        
        if (group) {
          for (const device of group.devices) {
            if (device.token) {
              this.wss.sendToDevice(device.token, {
                type: 'playlist',
                playlist: {
                  _id: playlist._id,
                  name: playlist.name,
                  songs: playlist.songs.map(song => ({
                    _id: song._id,
                    name: song.name,
                    artist: song.artist,
                    filePath: song.filePath,
                    duration: song.duration
                  }))
                }
              });
            }
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