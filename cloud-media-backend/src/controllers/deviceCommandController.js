const VolumeController = require('./commands/VolumeController');
const EmergencyController = require('./commands/EmergencyController');
const RestartController = require('./commands/RestartController');
const Device = require('../models/Device');

const deviceCommandController = {
  setVolume: VolumeController.setVolume,
  emergencyStop: EmergencyController.emergencyStop,
  emergencyReset: EmergencyController.emergencyReset,
  restartDevice: RestartController.restartDevice,

  setPower: async (req, res) => {
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
  },

  playAnnouncement: async (req, res) => {
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
  }
};

module.exports = deviceCommandController;