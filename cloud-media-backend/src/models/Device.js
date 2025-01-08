const mongoose = require('mongoose');

// Karışıklığa neden olabilecek karakterleri çıkardık:
// Çıkarılanlar: 0, O, 1, I, l
const ALLOWED_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

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
    validate: {
      validator: function(v) {
        if (v.length !== 6) return false;
        return v.split('').every(char => ALLOWED_CHARS.includes(char));
      },
      message: 'Token 6 karakterli olmalı ve sadece izin verilen karakterleri içermelidir (2-9 ve A-Z, 0,O,1,I,l hariç)'
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
  isPlaying: {
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
  let token = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    token += ALLOWED_CHARS[randomIndex];
  }
  return token;
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
