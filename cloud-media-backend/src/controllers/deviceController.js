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

    // Volume değerini kontrol et
    if (req.body.volume !== undefined) {
      // Volume değerinin 0-100 arasında olduğundan emin ol
      req.body.volume = Math.max(0, Math.min(100, parseInt(req.body.volume)));
    }

    Object.keys(req.body).forEach(key => {
      device[key] = req.body[key];
    });

    const updatedDevice = await device.save();
    
    // WebSocket üzerinden diğer admin'lere bildir
    if (req.wss) {
      req.wss.broadcastToAdmins({
        type: 'deviceUpdate',
        deviceId: device._id,
        updates: req.body
      });
    }

    res.json(updatedDevice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteDevice = async (req, res) => {
  try {
    // İlk olarak cihazı bul
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ 
        message: 'Cihaz bulunamadı',
        status: 'error' 
      });
    }

    const deviceToken = device.token;

    try {
      // Silme başladı bildirimi
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteStarted('device', req.params.id, {
          deviceName: device.name
        })
      );
    } catch (error) {
      console.error('Broadcast error:', error);
      // Hata olsa bile devam et
    }

    // Token'ı güncelle
    try {
      await Token.findOneAndUpdate(
        { token: deviceToken },
        { $set: { isUsed: false } }
      );
    } catch (error) {
      console.error('Token update error:', error);
      // Token güncellemesi başarısız olsa bile devam et
    }

    // Cihaza silme bildirimi gönder
    try {
      req.wss.sendToDevice(deviceToken, {
        type: 'delete',
        entityType: 'device',
        entityId: device._id
      });
    } catch (error) {
      console.error('Device notification error:', error);
      // Bildirim gönderilemese bile devam et
    }

    // Cihazı sil
    try {
      await Device.findByIdAndDelete(device._id);
    } catch (error) {
      console.error('Device deletion error:', error);
      throw error; // Bu hatayı fırlat çünkü kritik bir işlem
    }
    
    try {
      // Başarılı silme bildirimi
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteSuccess('device', device._id, {
          deviceName: device.name
        })
      );
    } catch (error) {
      console.error('Success broadcast error:', error);
      // Bildirim hatası olsa bile devam et
    }

    res.json({ 
      message: 'Cihaz başarıyla silindi',
      status: 'success',
      deviceToken: deviceToken
    });

  } catch (error) {
    console.error('Device deletion error:', error);
    
    try {
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteError('device', req.params.id, error)
      );
    } catch (broadcastError) {
      console.error('Error broadcast failed:', broadcastError);
    }
    
    // Hata durumunda 500 dön ama uygulamayı kapatma
    res.status(500).json({ 
      message: error.message || 'Cihaz silinirken bir hata oluştu',
      status: 'error'
    });
  }
};

module.exports = {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice
};