const express = require('express');
const router = express.Router();
const Playlist = require('../../models/Playlist');
const Device = require('../../models/Device');
const PlaybackHistory = require('../../models/PlaybackHistory');

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

    const playbackHistory = await PlaybackHistory.aggregate([
      {
        $match: {
          playedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalPlaylists,
      activePlaylists,
      devicesPlaying: totalDevicesPlaying,
      playbackHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;