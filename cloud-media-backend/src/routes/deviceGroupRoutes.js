const express = require('express');
const router = express.Router();
const DeviceGroup = require('../models/DeviceGroup');
const historyRoutes = require('./device-groups/groupHistoryRoutes');
const statisticsRoutes = require('./device-groups/groupStatisticsRoutes');
const templateRoutes = require('./device-groups/groupTemplateRoutes');

// Mount sub-routers
router.use('/', historyRoutes);
router.use('/', statisticsRoutes);
router.use('/', templateRoutes);

// Tüm grupları getir
router.get('/', async (req, res) => {
  try {
    const { 
      template, 
      page = 1, 
      limit = 10, 
      parentGroup = null,
      tag,
      favorites,
      search 
    } = req.query;
    
    let query = template ? { isTemplate: true } : { isTemplate: false };
    
    if (parentGroup) {
      query.parentGroup = parentGroup;
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    if (favorites === 'true') {
      query.isFavorite = true;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const groups = await DeviceGroup.find(query)
      .populate('devices', 'name token location isOnline')
      .populate('parentGroup', 'name')
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

// Alt grupları getir
router.get('/:id/subgroups', async (req, res) => {
  try {
    const groups = await DeviceGroup.find({ parentGroup: req.params.id })
      .populate('devices', 'name token location isOnline');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Üst grupları getir
router.get('/:id/ancestors', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    const ancestors = await group.getAncestors();
    res.json(ancestors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Etiketleri güncelle
router.patch('/:id/tags', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    
    group.tags = req.body.tags;
    await group.save();
    
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Favorilere ekle/çıkar
router.patch('/:id/favorite', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    
    group.isFavorite = req.body.isFavorite;
    await group.save();
    
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
