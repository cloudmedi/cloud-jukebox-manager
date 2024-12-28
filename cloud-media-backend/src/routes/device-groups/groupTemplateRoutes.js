const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');

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

module.exports = router;