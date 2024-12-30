const Device = require('../../models/Device');
const Notification = require('../../models/Notification');

class RestartController {
  static async restartDevice(req, res) {
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
  }
}

module.exports = RestartController;