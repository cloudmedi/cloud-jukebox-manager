const Device = require('../../models/Device');
const Notification = require('../../models/Notification');
const EmergencyStateManager = require('../../emergency/EmergencyStateManager');

const emergencyStop = async (req, res) => {
  try {
    await EmergencyStateManager.activateEmergency();
    
    const devices = await Device.find({ isOnline: true });
    let successCount = 0;
    
    for (const device of devices) {
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'emergency-stop'
      });

      if (sent) {
        successCount++;
      } else {
        console.error(`Failed to send emergency stop to device ${device.token}`);
      }
    }

    // Admin'lere broadcast
    req.wss.broadcastToAdmins({
      type: 'emergency',
      action: 'stopped',
      message: 'Tüm cihazlar acil durum nedeniyle durduruldu'
    });

    await Notification.create({
      type: 'system',
      title: 'Acil Durum Aktif',
      message: `${devices.length} cihazdan ${successCount} tanesine acil durum komutu gönderildi`,
      read: false
    });

    res.json({ 
      message: 'Acil durum durdurma komutu gönderildi',
      totalDevices: devices.length,
      successCount
    });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ message: error.message });
  }
};

const emergencyReset = async (req, res) => {
  try {
    await EmergencyStateManager.deactivateEmergency();
    
    const devices = await Device.find({ emergencyStopped: true });
    let successCount = 0;
    
    for (const device of devices) {
      console.log(`Sending emergency reset to device: ${device.token}`);
      
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'emergency-reset',
        action: 'resume-playback',
        resumePlayback: true
      });

      if (sent) {
        successCount++;
        console.log(`Successfully sent emergency reset to device: ${device.token}`);
        
        // Update device status
        await Device.findByIdAndUpdate(device._id, {
          emergencyStopped: false,
          isPlaying: true
        });
      } else {
        console.error(`Failed to send emergency reset to device ${device.token}`);
      }
    }

    // Admin'lere broadcast
    req.wss.broadcastToAdmins({
      type: 'emergency',
      action: 'reset',
      message: 'Acil durum durumu kaldırıldı, cihazlar normal çalışmaya devam ediyor'
    });

    await Notification.create({
      type: 'system',
      title: 'Acil Durum Kaldırıldı',
      message: `${devices.length} cihazdan ${successCount} tanesine normal çalışma komutu gönderildi`,
      read: false
    });

    res.json({ 
      message: 'Acil durum sıfırlama komutu gönderildi',
      totalDevices: devices.length,
      successCount
    });
  } catch (error) {
    console.error('Emergency reset error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  emergencyStop,
  emergencyReset
};