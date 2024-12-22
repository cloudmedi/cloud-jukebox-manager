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

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;