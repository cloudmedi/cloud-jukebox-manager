const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Playlist = require('../models/Playlist');
const PlaylistSchedule = require('../models/PlaylistSchedule');

// Cihaz istatistiklerini getir
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

// Oynatma istatistiklerini getir
router.get('/playback', async (req, res) => {
  try {
    const totalPlaylists = await Playlist.countDocuments();
    const activePlaylists = await Playlist.countDocuments({ status: 'active' });
    const totalDevicesPlaying = await Device.countDocuments({ 
      activePlaylist: { $ne: null },
      isOnline: true 
    });

    // Son 30 günlük oynatma istatistikleri
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    res.json({
      totalPlaylists,
      activePlaylists,
      devicesPlaying: totalDevicesPlaying,
      playbackHistory: [] // Bu kısım için yeni bir model oluşturulabilir
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Zamanlama istatistiklerini getir
router.get('/schedules', async (req, res) => {
  try {
    const now = new Date();
    const activeSchedules = await PlaylistSchedule.countDocuments({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Zamanlama tiplerinin dağılımı
    const scheduleTypes = await PlaylistSchedule.aggregate([
      {
        $match: {
          status: 'active',
          startDate: { $lte: now },
          endDate: { $gte: now }
        }
      },
      {
        $group: {
          _id: '$repeatType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      activeSchedules,
      scheduleTypes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Performans metriklerini getir
router.get('/performance', async (req, res) => {
  try {
    // Örnek performans metrikleri
    // Gerçek uygulamada bu veriler sistem monitoring araçlarından gelebilir
    res.json({
      systemMetrics: {
        cpuUsage: 45,
        memoryUsage: 2.1,
        diskUsage: 68
      },
      responseTime: {
        average: 120,
        success: 99.9,
        error: 0.1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;