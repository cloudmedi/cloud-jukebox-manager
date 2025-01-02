const mongoose = require('mongoose');

const downloadProgressSchema = new mongoose.Schema({
  deviceToken: {
    type: String,
    required: true
  },
  playlistId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'error'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
  },
  downloadSpeed: {
    type: Number,
    default: 0
  },
  downloadedSongs: {
    type: Number,
    default: 0
  },
  totalSongs: {
    type: Number,
    default: 0
  },
  estimatedTimeRemaining: {
    type: Number,
    default: 0
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastError: String,
  completedChunks: [{
    songId: String,
    chunkId: String,
    size: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DownloadProgress', downloadProgressSchema);