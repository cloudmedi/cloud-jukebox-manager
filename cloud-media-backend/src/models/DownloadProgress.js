const mongoose = require('mongoose');

const downloadProgressSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: true
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['downloading', 'paused', 'completed', 'error'],
    default: 'downloading'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentChunk: {
    type: Number,
    default: 0
  },
  totalChunks: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: 0
  },
  error: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

downloadProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DownloadProgress', downloadProgressSchema);