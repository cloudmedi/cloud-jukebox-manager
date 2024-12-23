const express = require('express');
const router = express.Router();
const DeviceGroup = require('../models/DeviceGroup');

// Tüm grupları getir
router.get('/', async (req, res) => {
  try {
    const groups = await DeviceGroup.find()
      .populate('devices', 'name token location isOnline');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir grubu getir
router.get('/:id', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id)
      .populate('devices', 'name token location isOnline');
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni grup oluştur
router.post('/', async (req, res) => {
  const group = new DeviceGroup({
    name: req.body.name,
    description: req.body.description,
    devices: req.body.devices,
    createdBy: req.body.createdBy
  });

  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Grup güncelle
router.patch('/:id', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    Object.keys(req.body).forEach(key => {
      group[key] = req.body[key];
    });

    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Grup sil
router.delete('/:id', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    await group.remove();
    res.json({ message: 'Grup silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Gruba cihaz ekle
router.post('/:id/devices', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    const deviceIds = req.body.devices;
    group.devices.push(...deviceIds);
    
    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Gruptan cihaz çıkar
router.delete('/:id/devices/:deviceId', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    group.devices = group.devices.filter(
      device => device.toString() !== req.params.deviceId
    );
    
    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;