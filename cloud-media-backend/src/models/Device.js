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
  }
}, {
  timestamps: true
});

// Cihaz durumunu güncelleme methodu
deviceSchema.methods.updateStatus = function(isOnline) {
  this.isOnline = isOnline;
  this.lastSeen = Date.now();
  return this.save();
};

// Ses seviyesini güncelleme methodu
deviceSchema.methods.setVolume = function(volume) {
  if (volume < 0 || volume > 100) {
    throw new Error('Ses seviyesi 0-100 arasında olmalıdır');
  }
  this.volume = volume;
  return this.save();
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;