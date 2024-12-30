const Device = require('../../models/Device');
const Notification = require('../../models/Notification');

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

module.exports = { setVolume };