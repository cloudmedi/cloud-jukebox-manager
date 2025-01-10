const mongoose = require('mongoose');

const playlistScheduleSchema = new mongoose.Schema({
  playlist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: [true, 'Playlist zorunludur']
  },
  startDate: {
    type: Date,
    required: [true, 'Başlangıç tarihi zorunludur']
  },
  endDate: {
    type: Date,
    required: [true, 'Bitiş tarihi zorunludur']
  },
  repeatType: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly'],
    default: 'once'
  },
  targets: {
    devices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device'
    }],
    groups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceGroup'
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Zamanlama çakışması kontrolü
playlistScheduleSchema.methods.checkConflict = async function() {
  const query = {
    _id: { $ne: this._id }, // Kendisi hariç
    status: 'active',
    playlist: this.playlist // Aynı playlist'e ait zamanlamaları kontrol et
  };

  // Tarih aralığı kontrolü - 1 dakikalık tolerans ekle
  const tolerance = 60000; // 1 dakika (milisaniye)
  const startDate = new Date(this.startDate.getTime() + tolerance);
  const endDate = new Date(this.endDate.getTime() - tolerance);

  query.$and = [
    {
      $or: [
        {
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        }
      ]
    }
  ];

  // Hedef cihaz veya gruplardan herhangi biri çakışıyorsa kontrol et
  const targetConditions = [];
  
  if (this.targets.devices && this.targets.devices.length > 0) {
    targetConditions.push({ 'targets.devices': { $in: this.targets.devices } });
  }
  
  if (this.targets.groups && this.targets.groups.length > 0) {
    targetConditions.push({ 'targets.groups': { $in: this.targets.groups } });
  }

  // Hedef koşullarını ekle
  if (targetConditions.length > 0) {
    query.$and.push({ $or: targetConditions });
  }

  console.log('Çakışma kontrolü sorgusu:', JSON.stringify(query, null, 2));
  const conflictingSchedules = await this.constructor.find(query);
  console.log('Çakışan zamanlamalar:', conflictingSchedules);
  
  return conflictingSchedules.length > 0;
};

const PlaylistSchedule = mongoose.model('PlaylistSchedule', playlistScheduleSchema);

module.exports = PlaylistSchedule;