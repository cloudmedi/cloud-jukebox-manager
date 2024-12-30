const Device = require('../../models/Device');
const Notification = require('../../models/Notification');

const takeScreenshot = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

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
    res.status(500).json({ message: error.message });
  }
};

module.exports = { takeScreenshot };