const Device = require('../models/Device');
const Notification = require('../models/Notification');
const DeleteService = require('../services/DeleteService');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');

const takeScreenshot = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    console.log('Taking screenshot for device:', device.token);

    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'screenshot'
    });

    if (sent) {
      res.json({ message: 'Ekran görüntüsü alma komutu gönderildi' });
    } else {
      await Notification.create({
        type: 'device',
        title: 'Ekran Görüntüsü Alınamadı',
        message: `${device.name} cihazı çevrimdışı olduğu için ekran görüntüsü alınamadı`,
        read: false
      });
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ message: error.message });
  }
};

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
    console.log('1. Volume command received:', { 
      deviceId: req.params.id, 
      volume: req.body.volume,
      requestBody: req.body
    });

    const device = await Device.findById(req.params.id);
    if (!device) {
      console.log('2. Device not found:', req.params.id);
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    const volume = req.body.volume;
    console.log('3. Device found, current volume:', {
      deviceId: device._id,
      currentVolume: device.volume,
      newVolume: volume,
      token: device.token
    });

    console.log('4. Sending volume command to device:', {
      token: device.token,
      volume: volume,
      wsInstance: !!req.wss
    });

    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'setVolume',
      volume
    });

    console.log('5. WebSocket command sent status:', {
      sent,
      token: device.token,
      volume
    });

    if (sent) {
      await device.setVolume(volume);
      console.log('6. Volume updated successfully:', {
        deviceId: device._id,
        newVolume: volume,
        dbUpdateSuccess: true
      });
      
      // Check volume threshold
      if (volume >= 80) {
        console.log('7. High volume notification created');
        await Notification.create({
          type: 'device',
          title: 'Yüksek Ses Seviyesi',
          message: `${device.name} cihazının ses seviyesi ${volume}% seviyesine ayarlandı`,
          read: false
        });
      }
      
      res.json({ message: 'Ses seviyesi güncellendi' });
    } else {
      console.log('8. Device is offline:', {
        token: device.token,
        lastSeen: device.lastSeen
      });
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    console.error('9. Volume control error:', {
      error: error.message,
      stack: error.stack
    });
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
    // EmergencyStateManager'ı aktifleştir
    await EmergencyStateManager.activateEmergency();
    
    // Tüm aktif cihazları bul
    const devices = await Device.find({ isOnline: true });
    
    // Her cihaz için emergency stop işlemi
    for (const device of devices) {
      // WebSocket üzerinden emergency stop komutu gönder
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'emergency-stop'
      });

      if (!sent) {
        console.error(`Failed to send emergency stop to device ${device.token}`);
      }
    }

    // Admin'lere broadcast
    req.wss.broadcastToAdmins({
      type: 'emergency',
      action: 'stopped',
      message: 'Tüm cihazlar acil durum nedeniyle durduruldu'
    });

    res.json({ message: 'Acil durum durdurma komutu gönderildi' });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ message: error.message });
  }
};

const emergencyReset = async (req, res) => {
  try {
    // EmergencyStateManager'ı deaktive et
    await EmergencyStateManager.deactivateEmergency();
    
    // Tüm cihazları bul
    const devices = await Device.find({ emergencyStopped: true });
    
    // Her cihaz için emergency reset işlemi
    for (const device of devices) {
      // WebSocket üzerinden emergency reset ve resume playback komutu gönder
      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'emergency-reset',
        action: 'resume-playback',
        resumePlayback: true  // Explicitly tell device to resume playback
      });

      if (!sent) {
        console.error(`Failed to send emergency reset to device ${device.token}`);
      }
    }

    // Admin'lere broadcast
    req.wss.broadcastToAdmins({
      type: 'emergency',
      action: 'reset',
      message: 'Acil durum durumu kaldırıldı, cihazlar normal çalışmaya devam ediyor'
    });

    res.json({ message: 'Acil durum sıfırlama komutu gönderildi' });
  } catch (error) {
    console.error('Emergency reset error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  restartDevice,
  setVolume,
  setPower,
  playAnnouncement,
  emergencyStop,
  emergencyReset,
  takeScreenshot
};
