const Device = require('../models/Device');
const Notification = require('../models/Notification');

const bulkAssignPlaylist = async (req, res) => {
  try {
    const { deviceIds, playlistId } = req.body;
    console.log('Bulk assigning playlist:', playlistId, 'to devices:', deviceIds);

    // Update all devices with the new playlist and reset progress
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
      console.log(`Sending playlist ${playlistId} to device ${device.token}`);
      
      // İlk olarak progress sıfırlandı bilgisini gönder
      req.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: device.token,
        downloadProgress: 0,
        playlistStatus: 'loading'
      });
      
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'loadPlaylist',
        playlistId: playlistId
      });

      if (!sent) {
        console.log(`Device ${device.token} is offline, creating notification`);
        await Notification.create({
          type: 'playlist',
          title: 'Playlist Yükleme Hatası',
          message: `${device.name} cihazı çevrimdışı olduğu için playlist yüklenemedi`,
          read: false
        });
      }
    }

    res.json({ message: 'Playlist başarıyla atandı' });
  } catch (error) {
    console.error('Bulk playlist assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateDeviceProgress = async (req, res) => {
  try {
    const { deviceId, progress } = req.body;
    console.log(`Updating device ${deviceId} progress to ${progress}`);
    
    // Önce device'ı bul
    const device = await Device.findById(deviceId);
    if (!device) {
      console.error(`Device not found: ${deviceId}`);
      return res.status(404).json({ message: 'Device not found' });
    }

    // Progress ve status'u güncelle
    device.downloadProgress = progress;
    device.playlistStatus = progress === 100 ? 'loaded' : 'loading';
    await device.save();

    console.log('Device updated:', device);

    // Admin'lere progress güncellemesini bildir
    req.wss.broadcastToAdmins({
      type: 'deviceStatus',
      token: device.token,
      downloadProgress: progress,
      playlistStatus: device.playlistStatus
    });

    // Device'a progress güncellemesini bildir
    req.wss.sendToDevice(device.token, {
      type: 'downloadProgress',
      progress: progress,
      deviceId: deviceId
    });

    res.json({ 
      success: true,
      device: device
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bulkAssignPlaylist,
  updateDeviceProgress
};