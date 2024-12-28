const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');

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

module.exports = router;