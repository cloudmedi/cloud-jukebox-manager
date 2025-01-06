const express = require('express');
const router = express.Router();
const PlaybackHistory = require('../models/PlaybackHistory');
const mongoose = require('mongoose');

// Playback history kaydetme endpoint'i
router.post('/', async (req, res) => {
  try {
    const { deviceId, songId, playDuration, completed } = req.body;

    // Gerekli alanların kontrolü
    if (!deviceId || !songId || typeof playDuration !== 'number') {
      return res.status(400).json({ 
        message: 'deviceId, songId ve playDuration zorunludur' 
      });
    }

    // ObjectId kontrolü
    if (!mongoose.Types.ObjectId.isValid(deviceId) || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ 
        message: 'Geçersiz deviceId veya songId' 
      });
    }

    const playbackHistory = new PlaybackHistory({
      deviceId,
      songId,
      playDuration,
      completed: completed || false
    });

    await playbackHistory.save();
    console.log('Playback history kaydedildi:', playbackHistory);

    res.status(201).json(playbackHistory);
  } catch (error) {
    console.error('Playback history kayıt hatası:', error);
    res.status(500).json({ 
      message: 'Playback history kaydedilirken hata oluştu',
      error: error.message 
    });
  }
});

// Cihaz bazlı çalma geçmişi sorgulama
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { deviceId: mongoose.Types.ObjectId(deviceId) };

    if (startDate || endDate) {
      query.playedAt = {};
      if (startDate) query.playedAt.$gte = new Date(startDate);
      if (endDate) query.playedAt.$lte = new Date(endDate);
    }

    const history = await PlaybackHistory.find(query)
      .populate('songId', 'title artist duration')
      .sort({ playedAt: -1 });

    res.json(history);
  } catch (error) {
    console.error('Playback history sorgulama hatası:', error);
    res.status(500).json({ 
      message: 'Çalma geçmişi alınırken hata oluştu',
      error: error.message 
    });
  }
});

module.exports = router;