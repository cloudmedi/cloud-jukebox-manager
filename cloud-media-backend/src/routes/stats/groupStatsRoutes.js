const express = require('express');
const router = express.Router();
const DeviceGroup = require('../../models/DeviceGroup');
const Device = require('../../models/Device');

router.get('/groups', async (req, res) => {
  try {
    const totalGroups = await DeviceGroup.countDocuments();
    const activeGroups = await DeviceGroup.countDocuments({ status: 'active' });

    // Grup bazlı cihaz dağılımı ve aktivite durumu
    const groupStats = await DeviceGroup.aggregate([
      {
        $lookup: {
          from: 'devices',
          localField: 'devices',
          foreignField: '_id',
          as: 'deviceDetails'
        }
      },
      {
        $project: {
          name: 1,
          totalDevices: { $size: '$devices' },
          activeDevices: {
            $size: {
              $filter: {
                input: '$deviceDetails',
                as: 'device',
                cond: { $eq: ['$$device.isOnline', true] }
              }
            }
          },
          status: 1,
          createdAt: 1
        }
      }
    ]);

    res.json({
      totalGroups,
      activeGroups,
      groupStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;