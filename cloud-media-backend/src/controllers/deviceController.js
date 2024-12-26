const Device = require('../models/Device');
const Token = require('../models/Token');

const getDevices = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const devices = await Device.find()
      .populate('activePlaylist')
      .populate('groupId')
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const devicesWithInfo = await Promise.all(
      devices.map(async (device) => {
        const tokenInfo = await Token.findOne({ token: device.token }).lean();
        return {
          ...device,
          deviceInfo: tokenInfo?.deviceInfo || null,
          playlistStatus: device.activePlaylist ? device.playlistStatus : null
        };
      })
    );

    res.json(devicesWithInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDevice = async (req, res) => {
  const device = new Device({
    name: req.body.name,
    token: req.body.token,
    location: req.body.location,
    volume: req.body.volume
  });

  try {
    const newDevice = await device.save();
    await Token.findOneAndUpdate(
      { token: req.body.token },
      { isUsed: true }
    );
    res.status(201).json(newDevice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    Object.keys(req.body).forEach(key => {
      device[key] = req.body[key];
    });

    const updatedDevice = await device.save();
    res.json(updatedDevice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteDevice = async (req, res) => {
  try {
    console.log('Cihaz silme isteği alındı:', req.params.id);
    
    const device = await Device.findById(req.params.id);
    if (!device) {
      console.log('Cihaz bulunamadı:', req.params.id);
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    console.log('Token durumu güncelleniyor...');
    await Token.findOneAndUpdate(
      { token: device.token },
      { $set: { isUsed: false } }
    );
    console.log('Token durumu güncellendi');

    console.log('Cihaz siliniyor...');
    await Device.deleteOne({ _id: device._id });
    console.log('Cihaz başarıyla silindi:', device._id);

    // WebSocket üzerinden admin clientlara bildir
    if (req.wss) {
      console.log('WebSocket bildirimi gönderiliyor...');
      req.wss.broadcastToAdmins({
        type: 'deviceDeleted',
        deviceId: device._id
      });
    }

    res.json({ message: 'Cihaz silindi' });
  } catch (error) {
    console.error('Cihaz silme hatası:', error);
    res.status(500).json({ message: error.message || 'Cihaz silinirken bir hata oluştu' });
  }
};

module.exports = {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice
};