const Device = require('../models/Device');
const Notification = require('../models/Notification');

const bulkAssignPlaylist = async (req, res) => {
  try {
    const { deviceIds, playlistId } = req.body;

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
      // İndirme başladığında progress 0
      await Device.findByIdAndUpdate(device._id, { downloadProgress: 0 });
      
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
    
    // Update device progress and status
    const updatedDevice = await Device.findByIdAndUpdate(deviceId, {
      downloadProgress: progress,
      playlistStatus: progress === 100 ? 'loaded' : 'loading'
    }, { new: true });

    if (!updatedDevice) {
      console.error(`Device not found: ${deviceId}`);
      return res.status(404).json({ message: 'Device not found' });
    }

    console.log(`Device updated:`, updatedDevice);

    // WebSocket ile progress güncellemesini gönder
    req.wss.sendToDevice(updatedDevice.token, {
      type: 'downloadProgress',
      progress: progress,
      deviceId: deviceId
    });

    // Broadcast to admin clients
    req.wss.broadcastToAdmins({
      type: 'deviceStatus',
      token: updatedDevice.token,
      downloadProgress: progress,
      playlistStatus: progress === 100 ? 'loaded' : 'loading'
    });

    res.json({ 
      success: true,
      device: updatedDevice
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