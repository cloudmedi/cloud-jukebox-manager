const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');

// Get group history
router.get('/:id/history', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }
    res.json(group.history || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;