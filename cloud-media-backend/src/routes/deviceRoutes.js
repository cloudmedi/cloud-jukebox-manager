const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// Tüm cihazları getir
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('activePlaylist')
      .populate('groupId');
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni cihaz oluştur
router.post('/', async (req, res) => {
  const device = new Device({
    name: req.body.name,
    token: Device.generateToken(),
    location: req.body.location
  });

  try {
    const newDevice = await device.save();
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
      if (key !== 'token') { // Token güncellenemez
        device[key] = req.body[key];
      }
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
    await device.remove();
    res.json({ message: 'Cihaz silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;