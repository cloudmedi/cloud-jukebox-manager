const Device = require('../models/Device');
const Token = require('../models/Token');
const DeleteMessage = require('../websocket/messages/DeleteMessage');

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
    // İlk olarak cihazı bul
    const device = await Device.findById(req.params.id);
    
    // Token'ı her durumda temizle
    if (device?.token) {
      await Token.findOneAndUpdate(
        { token: device.token },
        { $set: { isUsed: false } }
      );
    }

    // Silme başladı bildirimi
    if (device) {
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteStarted('device', req.params.id, {
          deviceName: device.name
        })
      );

      try {
        // Cihaza silme bildirimi gönder
        req.wss.sendToDevice(device.token, {
          type: 'delete',
          entityType: 'device',
          entityId: device._id
        });
      } catch (error) {
        console.log('Cihaza bildirim gönderilirken hata:', error);
      }

      // Cihazı sil - findByIdAndDelete yerine deleteOne kullan
      await Device.deleteOne({ _id: device._id });
      
      // Başarılı silme bildirimi
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteSuccess('device', device._id, {
          deviceName: device.name
        })
      );
    }
    
    // Her durumda başarılı yanıt dön
    res.json({ message: device ? 'Cihaz silindi' : 'Cihaz zaten silinmiş' });

  } catch (error) {
    console.error('Device deletion error:', error);
    
    // Hata bildirimi
    req.wss.broadcastToAdmins(
      DeleteMessage.createDeleteError('device', req.params.id, error)
    );
    
    res.status(500).json({ message: error.message || 'Cihaz silinirken bir hata oluştu' });
  }
};

module.exports = {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice
};
