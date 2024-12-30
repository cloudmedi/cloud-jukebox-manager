const Device = require('../../models/Device');
const Notification = require('../../models/Notification');

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
  setPower,
  playAnnouncement
};