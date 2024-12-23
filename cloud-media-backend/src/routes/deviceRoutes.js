const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Token = require('../models/Token');

router.get('/', async (req, res) => {
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
});

// Yeni cihaz oluştur
router.post('/', async (req, res) => {
  console.log('Creating new device with data:', req.body);
  
  try {
    // Önce token'ı kontrol et
    const existingToken = await Token.findOne({ token: req.body.token });
    console.log('Found token:', existingToken);

    if (!existingToken) {
      console.log('Token not found:', req.body.token);
      return res.status(400).json({ message: 'Geçersiz token' });
    }

    if (existingToken.isUsed) {
      console.log('Token already used:', existingToken);
      return res.status(400).json({ message: 'Token daha önce kullanılmış' });
    }

    const device = new Device({
      name: req.body.name,
      token: req.body.token,
      location: req.body.location,
      volume: req.body.volume
    });

    const newDevice = await device.save();
    console.log('Device created:', newDevice);

    // Token'ı kullanıldı olarak işaretle
    await Token.findOneAndUpdate(
      { token: req.body.token },
      { isUsed: true }
    );
    console.log('Token marked as used');

    res.status(201).json(newDevice);
  } catch (error) {
    console.error('Device creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Cihaz güncelle
router.patch('/:id', async (req, res) => {
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
});

// Cihaz sil
router.delete('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // Önce cihazın token'ını serbest bırak
    await Token.findOneAndUpdate(
      { token: device.token },
      { isUsed: false }
    );

    // WebSocket üzerinden cihaza playlist temizleme komutu gönder
    if (device.isOnline && req.wss) {
      req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'clearPlaylists'
      });
    }

    // Cihazı sil (remove() yerine deleteOne() kullan)
    await Device.deleteOne({ _id: device._id });
    
    res.json({ message: 'Cihaz silindi' });
  } catch (error) {
    console.error('Device deletion error:', error);
    res.status(500).json({ message: 'Cihaz silinirken bir hata oluştu' });
  }
});

module.exports = router;
