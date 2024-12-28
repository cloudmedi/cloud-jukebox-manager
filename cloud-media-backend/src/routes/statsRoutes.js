const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Playlist = require('../models/Playlist');
const PlaylistSchedule = require('../models/PlaylistSchedule');
const PlaybackHistory = require('../models/PlaybackHistory');
const ErrorLog = require('../models/ErrorLog');
const mongoose = require('mongoose');

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

// Cihaz çalma verilerini getir
router.get('/device-playback', async (req, res) => {
  try {
    const { deviceId, from, to, startTime, endTime } = req.query;

    if (!deviceId || !from || !to || !startTime || !endTime) {
      return res.status(400).json({ 
        message: "Gerekli parametreler eksik" 
      });
    }

    // Tarih aralığını oluştur
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Saat bilgilerini parse et
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Başlangıç ve bitiş zamanlarını ayarla
    fromDate.setHours(startHour, startMinute, 0);
    toDate.setHours(endHour, endMinute, 59);

    // Cihazın belirtilen tarih aralığındaki çalma verilerini getir
    const playbackData = await PlaybackHistory.aggregate([
      {
        $match: {
          deviceId: mongoose.Types.ObjectId(deviceId),
          playedAt: {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $lookup: {
          from: 'songs',
          localField: 'songId',
          foreignField: '_id',
          as: 'songDetails'
        }
      },
      {
        $unwind: '$songDetails'
      },
      {
        $group: {
          _id: '$songId',
          songName: { $first: '$songDetails.title' },
          artist: { $first: '$songDetails.artist' },
          playCount: { $sum: 1 },
          totalDuration: { $sum: '$songDetails.duration' },
          lastPlayed: { $max: '$playedAt' }
        }
      },
      {
        $sort: { playCount: -1 }
      }
    ]);

    res.json(playbackData);
  } catch (error) {
    console.error('Device playback stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Uptime istatistiklerini getir
router.get('/uptime', async (req, res) => {
  try {
    const { deviceId, period } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // Son görülme ve çevrimiçi durumu
    const uptimeData = {
      deviceName: device.name,
      lastSeen: device.lastSeen,
      isOnline: device.isOnline,
      currentUptime: device.isOnline ? new Date() - device.lastSeen : 0,
      totalUptime: 0,
      uptimePercentage: 0
    };

    res.json(uptimeData);
  } catch (error) {
    console.error('Uptime stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Hata loglarını getir
router.get('/error-logs', async (req, res) => {
  try {
    const { deviceId, type, from, to, limit = 100 } = req.query;
    const query = {};

    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (type) {
      query.type = type;
    }

    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const logs = await ErrorLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('deviceId', 'name location');

    res.json(logs);
  } catch (error) {
    console.error('Error logs fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;