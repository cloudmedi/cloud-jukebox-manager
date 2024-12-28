const Device = require('../models/Device');
const Notification = require('../models/Notification');
const DeleteService = require('../services/DeleteService');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');

const restartDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'restart'
    });

    if (sent) {
      res.json({ message: 'Cihaz yeniden başlatılıyor' });
    } else {
      // Create offline notification
      await Notification.create({
        type: 'device',
        title: 'Cihaz Çevrimdışı',
        message: `${device.name} cihazı çevrimdışı olduğu için komut gönderilemedi`,
        read: false
      });
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setVolume = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    const volume = req.body.volume;
    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'setVolume',
      volume
    });

    if (sent) {
      await device.setVolume(volume);
      
      // Check volume threshold
      if (volume >= 80) {
        await Notification.create({
          type: 'device',
          title: 'Yüksek Ses Seviyesi',
          message: `${device.name} cihazının ses seviyesi ${volume}% seviyesine ayarlandı`,
          read: false
        });
      }
      
      res.json({ message: 'Ses seviyesi güncellendi' });
    } else {
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setPower = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    device.isOnline = req.body.power;
    await device.save();

    res.json({ message: `Cihaz ${req.body.power ? 'açıldı' : 'kapatıldı'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const playAnnouncement = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'playAnnouncement',
      announcement: req.body.announcement
    });

    if (sent) {
      res.json({ message: 'Anons oynatma komutu gönderildi' });
    } else {
      await Notification.create({
        type: 'device',
        title: 'Anons Gönderilemedi',
        message: `${device.name} cihazı çevrimdışı olduğu için anons gönderilemedi`,
        read: false
      });
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const emergencyStop = async (req, res) => {
  try {
    console.log('Emergency stop initiated');
    
    // Activate emergency state
    await EmergencyStateManager.activateEmergency();
    
    // Find all active devices
    const devices = await Device.find({ isOnline: true });
    let successCount = 0;
    
    // Send emergency stop to each device
    for (const device of devices) {
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'emergency-stop'
      });

      if (sent) {
        successCount++;
        await device.updateOne({
          emergencyStopped: true,
          playlistStatus: 'emergency-stopped',
          volume: 0
        });
      }
    }

    // Broadcast to admins
    req.wss.broadcastToAdmins({
      type: 'emergency',
      action: 'stopped',
      message: `Tüm cihazlar acil durum nedeniyle durduruldu (${successCount}/${devices.length} başarılı)`
    });

    // Create notification
    await Notification.create({
      type: 'emergency',
      title: 'Acil Durum Aktif',
      message: 'Tüm cihazlar acil durum nedeniyle durduruldu',
      read: false
    });

    res.json({ 
      message: 'Acil durum durdurma komutu gönderildi',
      success: true,
      affectedDevices: successCount
    });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ 
      message: error.message || 'Acil durum komutu gönderilemedi',
      success: false 
    });
  }
};

const emergencyReset = async (req, res) => {
  try {
    console.log('Emergency reset initiated');
    
    // Deactivate emergency state
    await EmergencyStateManager.deactivateEmergency();
    
    // Find all emergency stopped devices
    const devices = await Device.find({ emergencyStopped: true });
    let successCount = 0;
    
    // Send emergency reset to each device
    for (const device of devices) {
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'emergency-reset',
        action: 'resume-playback'
      });

      if (sent) {
        successCount++;
        await device.updateOne({
          emergencyStopped: false,
          playlistStatus: 'loaded',
          volume: 50 // Reset to default volume
        });
      }
    }

    // Broadcast to admins
    req.wss.broadcastToAdmins({
      type: 'emergency',
      action: 'reset',
      message: `Acil durum durumu kaldırıldı (${successCount}/${devices.length} başarılı)`
    });

    // Create notification
    await Notification.create({
      type: 'emergency',
      title: 'Acil Durum Kaldırıldı',
      message: 'Cihazlar normal çalışmaya devam ediyor',
      read: false
    });

    res.json({ 
      message: 'Acil durum sıfırlama komutu gönderildi',
      success: true,
      affectedDevices: successCount
    });
  } catch (error) {
    console.error('Emergency reset error:', error);
    res.status(500).json({ 
      message: error.message || 'Acil durum sıfırlama komutu gönderilemedi',
      success: false 
    });
  }
};

module.exports = {
  restartDevice,
  setVolume,
  setPower,
  playAnnouncement,
  emergencyStop,
  emergencyReset
};