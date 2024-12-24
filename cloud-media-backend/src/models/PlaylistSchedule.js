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
  const conflictingSchedules = await this.constructor.find({
    $or: [
      {
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.startDate }
      }
    ],
    status: 'active',
    _id: { $ne: this._id },
    $or: [
      { 'targets.devices': { $in: this.targets.devices } },
      { 'targets.groups': { $in: this.targets.groups } }
    ]
  });
  
  return conflictingSchedules.length > 0;
};

const PlaylistSchedule = mongoose.model('PlaylistSchedule', playlistScheduleSchema);

module.exports = PlaylistSchedule;