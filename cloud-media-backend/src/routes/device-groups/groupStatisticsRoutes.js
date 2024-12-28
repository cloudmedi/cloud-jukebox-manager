const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');

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

module.exports = router;