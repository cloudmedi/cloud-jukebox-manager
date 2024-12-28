const express = require('express');
const router = express.Router();
const Device = require('../../models/Device');

router.get('/devices', async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const onlineDevices = await Device.countDocuments({ isOnline: true });
    const offlineDevices = totalDevices - onlineDevices;

    // Grup bazlı cihaz dağılımı
    const devicesByGroup = await Device.aggregate([
      {
        $group: {
          _id: '$groupId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'devicegroups',
          localField: '_id',
          foreignField: '_id',
          as: 'group'
        }
      }
    ]);

    res.json({
      total: totalDevices,
      online: onlineDevices,
      offline: offlineDevices,
      groupDistribution: devicesByGroup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;