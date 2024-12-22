const mongoose = require('mongoose');

const playbackHistorySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  playedAt: {
    type: Date,
    default: Date.now
  },
  playDuration: {
    type: Number, // saniye cinsinden
    required: true
  }
}, {
  timestamps: true
});

// İndexler
playbackHistorySchema.index({ deviceId: 1, playedAt: 1 });
playbackHistorySchema.index({ songId: 1 });

const PlaybackHistory = mongoose.model('PlaybackHistory', playbackHistorySchema);

module.exports = PlaybackHistory;