const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');
const Device = require('../../models/Device');

// Auto-create groups based on rules
router.post('/auto-create', async (req, res) => {
  try {
    const { rule, prefix } = req.body;
    const devices = await Device.find();
    const groups = new Map();

    // Group devices based on the selected rule
    devices.forEach(device => {
      let key;
      switch (rule) {
        case 'location':
          key = device.location || 'Diğer';
          break;
        case 'status':
          key = device.isOnline ? 'Online' : 'Offline';
          break;
        default:
          key = 'Default';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(device._id);
    });

    // Create groups for each unique value
    const createdGroups = [];
    for (const [key, deviceIds] of groups) {
      const group = new DeviceGroup({
        name: `${prefix}${key}`,
        description: `${key} için otomatik oluşturulan grup`,
        devices: deviceIds,
        createdBy: 'System',
        status: 'active'
      });

      await group.save();
      createdGroups.push(group);
    }

    res.status(201).json(createdGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;