const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Anons başlığı zorunludur'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Anons içeriği zorunludur'],
    trim: true
  },
  audioFile: {
    type: String,
    required: [true, 'Ses dosyası zorunludur']
  },
  duration: {
    type: Number,
    required: [true, 'Anons süresi zorunludur']
  },
  startDate: {
    type: Date,
    required: [true, 'Başlangıç tarihi zorunludur']
  },
  endDate: {
    type: Date,
    required: [true, 'Bitiş tarihi zorunludur']
  },
  scheduleType: {
    type: String,
    enum: ['songs', 'minutes', 'specific'],
    required: [true, 'Zamanlama tipi zorunludur']
  },
  playMode: {
    type: String,
    enum: ['sequential', 'random'],
    default: 'sequential'
  },
  songInterval: {
    type: Number,
    min: 1,
    default: null
  },
  minuteInterval: {
    type: Number,
    min: 1,
    default: null
  },
  lastPlayedAt: {
    type: Date,
    default: null
  },
  playCount: {
    type: Number,
    default: 0
  },
  immediateInterrupt: {
    type: Boolean,
    default: false
  },
  specificTimes: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} geçerli bir saat formatı değil!`
    }
  }],
  targetDevices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  }],
  targetGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceGroup'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Anons silindiğinde ilgili cihazlardan referansını temizle
announcementSchema.pre('remove', async function(next) {
  const Device = mongoose.model('Device');
  await Device.updateMany(
    { activeAnnouncements: this._id },
    { $pull: { activeAnnouncements: this._id } }
  );
  next();
});

// Sıradaki anonsu seç (sıralı veya random)
announcementSchema.statics.getNextAnnouncement = async function(deviceId, scheduleType) {
  const now = new Date();
  
  // Aktif anonsları bul
  const announcements = await this.find({
    status: 'active',
    scheduleType: scheduleType,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { targetDevices: deviceId },
      { targetGroups: { $in: await this.getDeviceGroupIds(deviceId) } }
    ]
  }).sort('lastPlayedAt');

  if (announcements.length === 0) return null;

  // Çalma moduna göre anons seç
  let selectedAnnouncement;
  if (announcements[0].playMode === 'random') {
    const randomIndex = Math.floor(Math.random() * announcements.length);
    selectedAnnouncement = announcements[randomIndex];
  } else {
    // En son çalınan anonsu bul ve sıradakini seç
    selectedAnnouncement = announcements[0];
  }

  // Son çalma zamanını ve sayısını güncelle
  await this.findByIdAndUpdate(selectedAnnouncement._id, {
    lastPlayedAt: now,
    $inc: { playCount: 1 }
  });

  return selectedAnnouncement;
});

// Yardımcı fonksiyon: Cihazın grup ID'lerini getir
announcementSchema.statics.getDeviceGroupIds = async function(deviceId) {
  const Device = mongoose.model('Device');
  const device = await Device.findById(deviceId);
  return device ? device.groupId ? [device.groupId] : [] : [];
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;