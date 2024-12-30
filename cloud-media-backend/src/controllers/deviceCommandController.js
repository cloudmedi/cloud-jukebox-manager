const Device = require('../models/Device');
const Notification = require('../models/Notification');
const DeleteService = require('../services/DeleteService');

const restartDevice = async (req, res) => {
  try {
    console.log('Restart command received for device:', req.params.id);
    
    const device = await Device.findById(req.params.id);
    if (!device) {
      console.log('Device not found:', req.params.id);
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    console.log('Sending restart command to device:', {
      deviceId: device._id,
      token: device.token
    });

    // WebSocket üzerinden cihaza restart komutu gönder
    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'restart',
      deviceId: device._id
    });

    if (sent) {
      console.log('Restart command sent successfully');
      
      // Başarılı gönderim durumunda bildirim oluştur
      await Notification.create({
        type: 'device',
        title: 'Cihaz Yeniden Başlatılıyor',
        message: `${device.name} cihazı yeniden başlatılıyor`,
        read: false
      });

      res.json({ 
        message: 'Cihaz yeniden başlatılıyor',
        success: true 
      });
    } else {
      console.log('Device is offline, creating notification');
      
      // Cihaz çevrimdışıysa bildirim oluştur
      await Notification.create({
        type: 'device',
        title: 'Cihaz Çevrimdışı',
        message: `${device.name} cihazı çevrimdışı olduğu için komut gönderilemedi`,
        read: false
      });

      res.status(404).json({ 
        message: 'Cihaz çevrimiçi değil',
        success: false 
      });
    }
  } catch (error) {
    console.error('Restart command error:', error);
    res.status(500).json({ 
      message: error.message,
      success: false 
    });
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

    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'setVolume',
      volume
    });

    if (sent) {
      await device.setVolume(volume);
      console.log('4. Volume updated successfully');
      
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
      console.log('5. Device is offline');
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    console.error('6. Volume control error:', error);
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

module.exports = {
  restartDevice,
  setVolume,
  setPower,
  playAnnouncement
};
