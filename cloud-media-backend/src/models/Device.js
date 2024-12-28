const mongoose = require('mongoose');

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
    min: [0, 'Ses seviyesi 0\'dan küçük olamaz'],
    max: [100, 'Ses seviyesi 100\'den büyük olamaz'],
    default: 50,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0 && v <= 100;
      },
      message: 'Ses seviyesi 0-100 arasında tam sayı olmalıdır'
    }
  },

  activePlaylist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    default: null
  },
  playlistStatus: {
    type: String,
    enum: ['loaded', 'loading', 'error', 'emergency-stopped', null],
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
  emergencyStopped: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Token oluşturma için helper method
deviceSchema.statics.generateToken = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Cihaz durumunu güncelleme methodu
deviceSchema.methods.updateStatus = async function(isOnline) {
  try {
    this.isOnline = isOnline;
    this.lastSeen = Date.now();
    await this.save();
    return true;
  } catch (error) {
    console.error('Error updating device status:', error);
    return false;
  }
};

deviceSchema.methods.setVolume = async function(volume) {
  const normalizedVolume = Math.max(0, Math.min(100, volume));
  this.volume = normalizedVolume;
  return this.save();
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
