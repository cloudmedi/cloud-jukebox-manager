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

// Zamanlama çakışması kontrolü - Güncellenmiş versiyon
playlistScheduleSchema.methods.checkConflict = async function() {
  // Eğer hedef cihaz veya grup yoksa çakışma kontrolü yapmaya gerek yok
  if ((!this.targets.devices || this.targets.devices.length === 0) && 
      (!this.targets.groups || this.targets.groups.length === 0)) {
    return false;
  }

  const query = {
    _id: { $ne: this._id }, // Kendisi hariç
    status: 'active',
    startDate: { $lt: this.endDate },
    endDate: { $gt: this.startDate }
  };

  // Hedef cihaz veya gruplardan herhangi biri çakışıyorsa kontrol et
  if (this.targets.devices && this.targets.devices.length > 0) {
    query['targets.devices'] = { $in: this.targets.devices };
  }
  
  if (this.targets.groups && this.targets.groups.length > 0) {
    query['targets.groups'] = { $in: this.targets.groups };
  }

  const conflictingSchedules = await this.constructor.find(query);
  console.log('Çakışan zamanlamalar:', conflictingSchedules);
  
  return conflictingSchedules.length > 0;
};

const PlaylistSchedule = mongoose.model('PlaylistSchedule', playlistScheduleSchema);

module.exports = PlaylistSchedule;