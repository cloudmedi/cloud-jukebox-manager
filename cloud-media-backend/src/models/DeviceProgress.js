const mongoose = require('mongoose');

const deviceProgressSchema = new mongoose.Schema({
  deviceToken: {
    type: String,
    required: true,
    ref: 'Device'
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Playlist'
  },
  status: {
    type: String,
    enum: ['initializing', 'downloading', 'paused', 'completed', 'error'],
    default: 'initializing'
  },
  completedChunks: [{
    type: String,
    required: true
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
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
    required: true
  },
  estimatedTimeRemaining: {
    type: Number,
    default: 0
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastError: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// İndirme durumunu güncelleme methodu
deviceProgressSchema.methods.updateProgress = async function(updates) {
  Object.assign(this, updates);
  return this.save();
};

// Cihaz için aktif indirme var mı kontrol et
deviceProgressSchema.statics.findActiveDownload = async function(deviceToken) {
  return this.findOne({
    deviceToken,
    status: { $in: ['initializing', 'downloading', 'paused'] }
  });
};

// Chunk'ı tamamlandı olarak işaretle
deviceProgressSchema.methods.markChunkCompleted = async function(chunkId) {
  if (!this.completedChunks.includes(chunkId)) {
    this.completedChunks.push(chunkId);
    this.progress = this.completedChunks.length / this.totalChunks;
    return this.save();
  }
  return this;
};

const DeviceProgress = mongoose.model('DeviceProgress', deviceProgressSchema);

module.exports = DeviceProgress;