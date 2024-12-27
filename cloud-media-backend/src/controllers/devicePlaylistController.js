const Device = require('../models/Device');
const Notification = require('../models/Notification');

const bulkAssignPlaylist = async (req, res) => {
  try {
    const { deviceIds, playlistId } = req.body;

    // Update all devices with the new playlist
    await Device.updateMany(
      { _id: { $in: deviceIds } },
      { 
        $set: { 
          activePlaylist: playlistId,
          playlistStatus: 'loading',
          downloadProgress: 0
        } 
      }
    );

    // Send playlist to each device via WebSocket
    const devices = await Device.find({ _id: { $in: deviceIds } });
    
    for (const device of devices) {
      // İndirme başlangıcını bildir
      await Device.findByIdAndUpdate(device._id, {
        downloadProgress: 0,
        playlistStatus: 'loading'
      });

      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'loadPlaylist',
        playlistId: playlistId
      });

      if (!sent) {
        // Create notification for offline devices
        await Notification.create({
          type: 'playlist',
          title: 'Playlist Yükleme Hatası',
          message: `${device.name} cihazı çevrimdışı olduğu için playlist yüklenemedi`,
          read: false
        });

        // Hata durumunu güncelle
        await Device.findByIdAndUpdate(device._id, {
          playlistStatus: 'error',
          downloadProgress: 0
        });
      }
    }

    res.json({ message: 'Playlist başarıyla atandı' });
  } catch (error) {
    console.error('Bulk playlist assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bulkAssignPlaylist
};