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

  // Hedef cihaz veya gruplar için çakışma kontrolü
  if (this.targets.devices.length > 0 || this.targets.groups.length > 0) {
    query.$or = [
      { 'targets.devices': { $in: this.targets.devices } },
      { 'targets.groups': { $in: this.targets.groups } }
    ];
  }

  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);

  // Saat bazlı çakışma kontrolü için dakika cinsinden hesaplama
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

  switch (this.repeatType) {
    case 'once':
      // Tek seferlik zamanlamalar için basit tarih kontrolü
      query.startDate = { $lt: endDate };
      query.endDate = { $gt: startDate };
      break;

    case 'daily':
      // Günlük tekrar için sadece saat kontrolü
      query.$expr = {
        $let: {
          vars: {
            scheduleStartMinutes: {
              $add: [
                { $multiply: [{ $hour: '$startDate' }, 60] },
                { $minute: '$startDate' }
              ]
            },
            scheduleEndMinutes: {
              $add: [
                { $multiply: [{ $hour: '$endDate' }, 60] },
                { $minute: '$endDate' }
              ]
            }
          },
          in: {
            $or: [
              {
                $and: [
                  { $lte: ['$$scheduleStartMinutes', endMinutes] },
                  { $gte: ['$$scheduleStartMinutes', startMinutes] }
                ]
              },
              {
                $and: [
                  { $lte: ['$$scheduleEndMinutes', endMinutes] },
                  { $gte: ['$$scheduleEndMinutes', startMinutes] }
                ]
              }
            ]
          }
        }
      };
      break;

    case 'weekly':
      // Haftalık tekrar için gün ve saat kontrolü
      query.$expr = {
        $and: [
          { $eq: [{ $dayOfWeek: '$startDate' }, { $dayOfWeek: startDate }] },
          {
            $let: {
              vars: {
                scheduleStartMinutes: {
                  $add: [
                    { $multiply: [{ $hour: '$startDate' }, 60] },
                    { $minute: '$startDate' }
                  ]
                },
                scheduleEndMinutes: {
                  $add: [
                    { $multiply: [{ $hour: '$endDate' }, 60] },
                    { $minute: '$endDate' }
                  ]
                }
              },
              in: {
                $or: [
                  {
                    $and: [
                      { $lte: ['$$scheduleStartMinutes', endMinutes] },
                      { $gte: ['$$scheduleStartMinutes', startMinutes] }
                    ]
                  },
                  {
                    $and: [
                      { $lte: ['$$scheduleEndMinutes', endMinutes] },
                      { $gte: ['$$scheduleEndMinutes', startMinutes] }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };
      break;

    case 'monthly':
      // Aylık tekrar için ayın günü ve saat kontrolü
      query.$expr = {
        $and: [
          { $eq: [{ $dayOfMonth: '$startDate' }, { $dayOfMonth: startDate }] },
          {
            $let: {
              vars: {
                scheduleStartMinutes: {
                  $add: [
                    { $multiply: [{ $hour: '$startDate' }, 60] },
                    { $minute: '$startDate' }
                  ]
                },
                scheduleEndMinutes: {
                  $add: [
                    { $multiply: [{ $hour: '$endDate' }, 60] },
                    { $minute: '$endDate' }
                  ]
                }
              },
              in: {
                $or: [
                  {
                    $and: [
                      { $lte: ['$$scheduleStartMinutes', endMinutes] },
                      { $gte: ['$$scheduleStartMinutes', startMinutes] }
                    ]
                  },
                  {
                    $and: [
                      { $lte: ['$$scheduleEndMinutes', endMinutes] },
                      { $gte: ['$$scheduleEndMinutes', startMinutes] }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };
      break;
  }

  const conflictingSchedules = await this.constructor.find(query);
  return conflictingSchedules.length > 0;
};

const PlaylistSchedule = mongoose.model('PlaylistSchedule', playlistScheduleSchema);

module.exports = PlaylistSchedule;