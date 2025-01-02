const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  index: Number,
  startByte: Number,
  endByte: Number,
  status: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'error'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  error: String,
  completedAt: Date
});

const downloadedSongSchema = new mongoose.Schema({
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  },
  status: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'error'],
    default: 'pending'
  },
  chunks: [chunkSchema],
  progress: Number,
  totalSize: Number,
  downloadedSize: Number,
  error: String,
  startedAt: Date,
  completedAt: Date
});

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cihaz adı zorunludur'],
    trim: true
  },
  token: {
    type: String,
    required: [true, 'Token zorunludur'],
    unique: true,
    length: 6,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: 'Token 6 haneli sayısal bir değer olmalıdır'
    }
  },
  location: {
    type: String,
    required: [true, 'Lokasyon zorunludur'],
    trim: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  volume: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  activePlaylist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    default: null
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceGroup',
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  downloadStatus: {
    status: {
      type: String,
      enum: ['idle', 'downloading', 'paused', 'error', 'completed'],
      default: 'idle'
    },
    currentSong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    },
    playlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist'
    },
    totalSongs: Number,
    downloadedSongs: Number,
    currentProgress: Number,
    totalProgress: Number,
    downloadSpeed: Number,
    estimatedTimeRemaining: Number,
    error: String,
    songs: [downloadedSongSchema],
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    startedAt: Date,
    completedAt: Date,
    retryCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Helper method to update download status
deviceSchema.methods.updateDownloadStatus = async function(status) {
  const oldStatus = this.downloadStatus;
  this.downloadStatus = {
    ...this.downloadStatus,
    ...status,
    lastUpdated: new Date()
  };

  // Log significant status changes
  if (oldStatus.status !== status.status) {
    console.log(`Device ${this.token} download status changed: ${oldStatus.status} -> ${status.status}`);
  }

  return this.save();
};

// Helper to update chunk status
deviceSchema.methods.updateChunkStatus = async function(songId, chunkIndex, status) {
  const song = this.downloadStatus.songs.find(s => s.songId.equals(songId));
  if (song && song.chunks[chunkIndex]) {
    song.chunks[chunkIndex] = {
      ...song.chunks[chunkIndex],
      ...status,
      completedAt: status.status === 'completed' ? new Date() : undefined
    };

    // Update song progress
    const completedChunks = song.chunks.filter(c => c.status === 'completed').length;
    song.progress = (completedChunks / song.chunks.length) * 100;

    // Update overall progress
    const totalProgress = this.downloadStatus.songs.reduce((acc, s) => acc + (s.progress || 0), 0);
    this.downloadStatus.totalProgress = totalProgress / this.downloadStatus.totalSongs;

    await this.save();
    return true;
  }
  return false;
};

// Helper to check for incomplete downloads
deviceSchema.methods.hasIncompleteDownloads = function() {
  return this.downloadStatus.status === 'downloading' || 
         this.downloadStatus.status === 'paused' ||
         (this.downloadStatus.status === 'error' && this.downloadStatus.retryCount < 3);
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
