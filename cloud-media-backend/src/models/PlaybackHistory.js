const mongoose = require('mongoose');

const playbackHistorySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Geçersiz device ID'
    }
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Geçersiz song ID'
    }
  },
  playedAt: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Geçersiz tarih formatı'
    },
    set: function(v) {
      // UTC'ye çevir
      if (v instanceof Date) {
        return new Date(v.toISOString());
      }
      return new Date(v);
    }
  },
  playDuration: {
    type: Number,
    required: true,
    min: [0, 'Süre negatif olamaz'],
    max: [24 * 60 * 60, 'Süre 24 saati geçemez'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Geçersiz süre'
    }
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// İndexler
playbackHistorySchema.index({ deviceId: 1, playedAt: -1 });
playbackHistorySchema.index({ songId: 1 });
playbackHistorySchema.index({ completed: 1 });

const PlaybackHistory = mongoose.model('PlaybackHistory', playbackHistorySchema);

module.exports = PlaybackHistory;