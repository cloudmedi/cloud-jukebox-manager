const express = require('express');
const router = express.Router();
const DeviceGroup = require('../models/DeviceGroup');

// Tüm grupları getir
router.get('/', async (req, res) => {
  try {
    const { template, page = 1, limit = 10 } = req.query;
    const query = template ? { isTemplate: true } : { isTemplate: false };
    
    const groups = await DeviceGroup.find(query)
      .populate('devices', 'name token location isOnline')
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
    const total = await DeviceGroup.countDocuments(query);
    
    res.json({
      groups,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
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

// Grup geçmişini getir
router.get('/:id/history', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    res.json(group.history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grup istatistiklerini getir
router.get('/:id/statistics', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    const stats = await group.updateStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni grup oluştur
router.post('/', async (req, res) => {
  try {
    const group = new DeviceGroup({
      name: req.body.name,
      description: req.body.description,
      devices: req.body.devices,
      createdBy: req.body.createdBy,
      isTemplate: req.body.isTemplate || false,
      templateName: req.body.templateName
    });

    const newGroup = await group.save();
    
    // Geçmişe kaydet
    newGroup.history.push({
      action: 'create',
      changes: newGroup.toObject(),
      performedBy: req.body.createdBy
    });
    await newGroup.save();
    
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

    const oldData = group.toObject();
    Object.keys(req.body).forEach(key => {
      group[key] = req.body[key];
    });

    // Geçmişe kaydet
    group.history.push({
      action: 'update',
      changes: {
        before: oldData,
        after: req.body
      },
      performedBy: req.body.updatedBy
    });

    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Grup klonla
router.post('/:id/clone', async (req, res) => {
  try {
    const sourceGroup = await DeviceGroup.findById(req.params.id);
    if (!sourceGroup) {
      return res.status(404).json({ message: 'Kaynak grup bulunamadı' });
    }

    const clonedGroup = await sourceGroup.clone(
      req.body.name,
      req.body.createdBy
    );

    // Geçmişe kaydet
    clonedGroup.history.push({
      action: 'clone',
      changes: {
        sourceGroup: sourceGroup._id,
        clonedName: req.body.name
      },
      performedBy: req.body.createdBy
    });
    await clonedGroup.save();

    res.status(201).json(clonedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Şablon oluştur
router.post('/templates', async (req, res) => {
  try {
    const template = await DeviceGroup.createTemplate({
      name: req.body.name,
      description: req.body.description,
      devices: req.body.devices,
      createdBy: req.body.createdBy
    });
    res.status(201).json(template);
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
    
    // Geçmişe kaydet
    group.history.push({
      action: 'update',
      changes: {
        addedDevices: deviceIds
      },
      performedBy: req.body.updatedBy
    });
    
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
    
    // Geçmişe kaydet
    group.history.push({
      action: 'update',
      changes: {
        removedDevices: [req.params.deviceId]
      },
      performedBy: req.body.updatedBy
    });
    
    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;