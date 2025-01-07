const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Playlist = require('../models/Playlist');
const PlaylistSchedule = require('../models/PlaylistSchedule');
const PlaybackHistory = require('../models/PlaybackHistory');
const ErrorLog = require('../models/ErrorLog');
const mongoose = require('mongoose');
const Token = require('../models/Token'); // Token modelini ekledik

router.get('/devices', async (req, res) => {
  try {
    const devices = await Device.find({}).select('_id name location token');
    // Her cihaz için token bilgisini obje formatına dönüştür
    const formattedDevices = devices.map(device => ({
      _id: device._id, // Cihazın kendi ID'sini kullanıyoruz
      name: device.name,
      location: device.location,
      token: device.token // Token string'i saklıyoruz
    }));
    res.json(formattedDevices);
  } catch (error) {
    console.error('Cihazlar alınırken hata:', error);
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

    console.log('Gelen parametreler:', { deviceId, from, to, startTime, endTime });

    if (!deviceId || !from || !to || !startTime || !endTime) {
      return res.status(400).json({ message: 'Eksik parametreler' });
    }

    // Önce cihazı bul ve token'ını al
    const device = await Device.findById(deviceId);
    console.log('Bulunan cihaz:', device);
    
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // Token'ı bul
    const token = await Token.findOne({ token: device.token });
    console.log('Bulunan token:', token);
    
    if (!token) {
      return res.status(404).json({ message: 'Token bulunamadı' });
    }

    console.log('Token ID:', token._id);

    // Tarih aralığını UTC olarak ayarla
    const startDate = new Date(from);
    startDate.setUTCHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);

    const endDate = new Date(to);
    endDate.setUTCHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 59, 999);

    console.log('Tarih aralığı:', { startDate, endDate });

    // Her çalınma kaydını ayrı göster
    const playbackData = await PlaybackHistory.aggregate([
      {
        $match: {
          deviceId: token._id,
          playedAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $lookup: {
          from: 'songs',
          localField: 'songId',
          foreignField: '_id',
          as: 'song'
        }
      },
      {
        $unwind: {
          path: '$song',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          songName: { $ifNull: ['$song.name', 'Bilinmeyen Şarkı'] },
          artist: { $ifNull: ['$song.artist', 'Bilinmeyen Sanatçı'] },
          playedAt: 1,
          duration: { $ifNull: ['$playDuration', 0] }
        }
      },
      {
        $sort: { playedAt: -1 } // En son çalınanlar üstte
      }
    ]);

    console.log('Sorgu sonucu:', playbackData);
    res.json(playbackData);
  } catch (error) {
    console.error('Çalma verileri alınırken hata:', error);
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

// Oynatma geçmişini kaydet
router.post('/playback-history', async (req, res) => {
  try {
    const { deviceId, songId, playDuration, completed } = req.body;

    if (!deviceId || !songId) {
      return res.status(400).json({
        message: "Device ID ve Song ID zorunludur"
      });
    }

    const playbackHistory = new PlaybackHistory({
      deviceId,
      songId,
      playDuration,
      completed,
      playedAt: new Date()
    });

    await playbackHistory.save();
    res.status(201).json(playbackHistory);
  } catch (error) {
    console.error('Error saving playback history:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint'i
router.get('/debug/playback-history/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // PlaybackHistory kayıtlarını kontrol et
    const playbackRecords = await PlaybackHistory.find({
      deviceId: new mongoose.Types.ObjectId(deviceId)
    }).populate('songId');

    // Songs koleksiyonunu kontrol et
    const songs = await mongoose.connection.collection('songs').find({}).toArray();

    res.json({
      playbackCount: playbackRecords.length,
      playbackSample: playbackRecords.slice(0, 5),
      songsCount: songs.length,
      songsSample: songs.slice(0, 5)
    });
  } catch (error) {
    console.error('Debug verisi alınırken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;