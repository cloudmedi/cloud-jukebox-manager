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

  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);
  const startTime = startDate.getHours() * 60 + startDate.getMinutes();
  const endTime = endDate.getHours() * 60 + endDate.getMinutes();

  switch (this.repeatType) {
    case 'once':
      query.$and = [{
        repeatType: 'once',
        $or: [
          {
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
          }
        ]
      }];
      break;

    case 'daily':
      query.$and = [{
        $or: [
          {
            repeatType: 'daily',
            $expr: {
              $or: [
                {
                  $and: [
                    { $lte: [{ $add: [{ $multiply: [{ $hour: '$startDate' }, 60] }, { $minute: '$startDate' }] }, endTime] },
                    { $gte: [{ $add: [{ $multiply: [{ $hour: '$startDate' }, 60] }, { $minute: '$startDate' }] }, startTime] }
                  ]
                }
              ]
            }
          },
          {
            repeatType: { $ne: 'daily' },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
          }
        ]
      }];
      break;

    case 'weekly':
      query.$and = [{
        $or: [
          {
            repeatType: 'weekly',
            $expr: {
              $and: [
                { $eq: [{ $dayOfWeek: '$startDate' }, { $dayOfWeek: startDate }] },
                {
                  $or: [
                    {
                      $and: [
                        { $lte: [{ $hour: '$startDate' }, endDate.getHours()] },
                        { $gte: [{ $hour: '$endDate' }, startDate.getHours()] }
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            repeatType: { $ne: 'weekly' },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
          }
        ]
      }];
      break;

    case 'monthly':
      query.$and = [{
        $or: [
          {
            repeatType: 'monthly',
            $expr: {
              $and: [
                { $eq: [{ $dayOfMonth: '$startDate' }, { $dayOfMonth: startDate }] },
                {
                  $or: [
                    {
                      $and: [
                        { $lte: [{ $hour: '$startDate' }, endDate.getHours()] },
                        { $gte: [{ $hour: '$endDate' }, startDate.getHours()] }
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            repeatType: { $ne: 'monthly' },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
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