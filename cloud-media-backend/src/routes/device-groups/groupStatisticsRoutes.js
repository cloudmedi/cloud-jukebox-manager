const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');
const Device = require('../../models/Device');

// Get group statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const group = await DeviceGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    // Calculate current statistics
    const totalDevices = group.devices.length;
    const activeDevices = await Device.countDocuments({
      _id: { $in: group.devices },
      isOnline: true
    });

    const statistics = {
      totalDevices,
      activeDevices,
      lastUpdated: new Date()
    };

    // Update group statistics
    group.statistics = statistics;
    await group.save();

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;