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

// Gelişmiş çakışma kontrolü
playlistScheduleSchema.methods.checkConflict = async function() {
  const query = {
    status: 'active',
    _id: { $ne: this._id }
  };

  // Hedef cihaz veya grupları kontrol et
  if (this.targets.devices.length > 0 || this.targets.groups.length > 0) {
    query.$or = [
      { 'targets.devices': { $in: this.targets.devices } },
      { 'targets.groups': { $in: this.targets.groups } }
    ];
  }

  // Tekrar tipine göre tarih kontrolü
  switch (this.repeatType) {
    case 'once':
      query.$and = [{
        $or: [
          {
            startDate: { $lte: this.endDate },
            endDate: { $gte: this.startDate }
          }
        ]
      }];
      break;

    case 'daily':
      // Günlük tekrar için saat bazlı kontrol
      const startTime = this.startDate.getHours() * 60 + this.startDate.getMinutes();
      const endTime = this.endDate.getHours() * 60 + this.endDate.getMinutes();
      
      query.$and = [{
        $or: [
          {
            repeatType: 'daily',
            $expr: {
              $and: [
                { $lte: [{ $add: [{ $multiply: [{ $hour: '$startDate' }, 60] }, { $minute: '$startDate' }] }, endTime] },
                { $gte: [{ $add: [{ $multiply: [{ $hour: '$endDate' }, 60] }, { $minute: '$endDate' }] }, startTime] }
              ]
            }
          },
          {
            repeatType: { $ne: 'daily' },
            startDate: { $lte: this.endDate },
            endDate: { $gte: this.startDate }
          }
        ]
      }];
      break;

    case 'weekly':
      // Haftalık tekrar için gün ve saat kontrolü
      query.$and = [{
        $or: [
          {
            repeatType: 'weekly',
            $expr: {
              $and: [
                { $eq: [{ $dayOfWeek: '$startDate' }, { $dayOfWeek: this.startDate }] },
                { $lte: [{ $hour: '$startDate' }, { $hour: this.endDate }] },
                { $gte: [{ $hour: '$endDate' }, { $hour: this.startDate }] }
              ]
            }
          },
          {
            repeatType: { $ne: 'weekly' },
            startDate: { $lte: this.endDate },
            endDate: { $gte: this.startDate }
          }
        ]
      }];
      break;

    case 'monthly':
      // Aylık tekrar için ayın günü ve saat kontrolü
      query.$and = [{
        $or: [
          {
            repeatType: 'monthly',
            $expr: {
              $and: [
                { $eq: [{ $dayOfMonth: '$startDate' }, { $dayOfMonth: this.startDate }] },
                { $lte: [{ $hour: '$startDate' }, { $hour: this.endDate }] },
                { $gte: [{ $hour: '$endDate' }, { $hour: this.startDate }] }
              ]
            }
          },
          {
            repeatType: { $ne: 'monthly' },
            startDate: { $lte: this.endDate },
            endDate: { $gte: this.startDate }
          }
        ]
      }];
      break;
  }

  const conflictingSchedules = await this.constructor.find(query);
  return conflictingSchedules.length > 0;
};

const PlaylistSchedule = mongoose.model('PlaylistSchedule', playlistScheduleSchema);

module.exports = PlaylistSchedule;