const Device = require('../../models/Device');
const Notification = require('../../models/Notification');

class VolumeController {
  static async setVolume(req, res) {
    try {
      console.log('Volume command received:', { 
        deviceId: req.params.id, 
        volume: req.body.volume 
      });

      const device = await Device.findById(req.params.id);
      if (!device) {
        console.log('Device not found:', req.params.id);
        return res.status(404).json({ message: 'Cihaz bulunamadı' });
      }

      const volume = req.body.volume;
      console.log('Sending volume command:', {
        token: device.token,
        volume: volume
      });

      const sent = req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'setVolume',
        volume
      });

      if (sent) {
        await device.setVolume(volume);
        
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
      console.error('Volume control error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = VolumeController;