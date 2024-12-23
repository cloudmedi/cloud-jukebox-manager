const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Token = require('../models/Token');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Cihazları listele
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().populate('activePlaylist').lean();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni cihaz oluştur
router.post('/', async (req, res) => {
  const device = new Device({
    name: req.body.name,
    token: req.body.token,
    location: req.body.location,
    volume: req.body.volume
  });

  try {
    const newDevice = await device.save();
    // Token'ı kullanıldı olarak işaretle
    await Token.findOneAndUpdate(
      { token: req.body.token },
      { isUsed: true }
    );
    res.status(201).json(newDevice);
  } catch (error) {
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
      { $set: { isUsed: false } }
    );

    // Bildirim oluştur
    await new Notification({
      type: 'device',
      title: 'Cihaz Silindi',
      message: `${device.name} cihazı silindi`
    }).save();

    // WebSocket üzerinden cihaza kapanma sinyali gönder
    if (req.wss) {
      req.wss.sendToDevice(device.token, {
        type: 'command',
        command: 'shutdown',
        reason: 'device_deleted'
      });
    }

    // Cihazı sil
    await Device.deleteOne({ _id: device._id });
    
    console.log('Device deleted successfully:', device._id);
    res.json({ message: 'Cihaz silindi' });
  } catch (error) {
    console.error('Device deletion error:', error);
    res.status(500).json({ message: error.message || 'Cihaz silinirken bir hata oluştu' });
  }
});

// Cihazı yeniden başlat
router.post('/:id/restart', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // WebSocket üzerinden cihaza restart komutu gönder
    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'restart'
    });

    if (sent) {
      res.json({ message: 'Cihaz yeniden başlatılıyor' });
    } else {
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ses seviyesini ayarla
router.post('/:id/volume', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // WebSocket üzerinden cihaza ses seviyesi değiştirme komutu gönder
    const sent = req.wss.sendToDevice(device.token, {
      type: 'command',
      command: 'setVolume',
      volume: req.body.volume
    });

    if (sent) {
      await device.setVolume(req.body.volume);
      res.json({ message: 'Ses seviyesi güncellendi' });
    } else {
      res.status(404).json({ message: 'Cihaz çevrimiçi değil' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cihazı aç/kapat
router.post('/:id/power', async (req, res) => {
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
});

// Acil durdur
router.post('/:id/emergency-stop', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // Burada cihaza acil durdurma sinyali gönderilecek
    // WebSocket veya başka bir yöntemle cihaza bilgi gönderilebilir

    res.json({ message: 'Cihaz acil olarak durduruldu' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;