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

  if (this.targets.devices.length > 0 || this.targets.groups.length > 0) {
    query.$or = [
      { 'targets.devices': { $in: this.targets.devices } },
      { 'targets.groups': { $in: this.targets.groups } }
    ];
  }

  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);

  // Convert times to minutes for easier comparison
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

  switch (this.repeatType) {
    case 'once':
      query.$and = [{
        repeatType: 'once',
        startDate: { $lt: endDate },
        endDate: { $gt: startDate }
      }];
      break;

    case 'daily':
      query.$and = [{
        $or: [
          {
            repeatType: 'daily',
            $expr: {
              $let: {
                vars: {
                  scheduleStart: { 
                    $add: [
                      { $multiply: [{ $hour: '$startDate' }, 60] }, 
                      { $minute: '$startDate' }
                    ]
                  },
                  scheduleEnd: { 
                    $add: [
                      { $multiply: [{ $hour: '$endDate' }, 60] }, 
                      { $minute: '$endDate' }
                    ]
                  }
                },
                in: {
                  $or: [
                    // Check if schedule start time falls within our time range
                    {
                      $and: [
                        { $gte: ['$$scheduleStart', startMinutes] },
                        { $lte: ['$$scheduleStart', endMinutes] }
                      ]
                    },
                    // Check if schedule end time falls within our time range
                    {
                      $and: [
                        { $gte: ['$$scheduleEnd', startMinutes] },
                        { $lte: ['$$scheduleEnd', endMinutes] }
                      ]
                    },
                    // Check if schedule encompasses our time range
                    {
                      $and: [
                        { $lte: ['$$scheduleStart', startMinutes] },
                        { $gte: ['$$scheduleEnd', endMinutes] }
                      ]
                    }
                  ]
                }
              }
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
                  $let: {
                    vars: {
                      scheduleStart: { 
                        $add: [
                          { $multiply: [{ $hour: '$startDate' }, 60] }, 
                          { $minute: '$startDate' }
                        ]
                      },
                      scheduleEnd: { 
                        $add: [
                          { $multiply: [{ $hour: '$endDate' }, 60] }, 
                          { $minute: '$endDate' }
                        ]
                      }
                    },
                    in: {
                      $or: [
                        { $and: [
                          { $gte: ['$$scheduleStart', startMinutes] },
                          { $lte: ['$$scheduleStart', endMinutes] }
                        ]},
                        { $and: [
                          { $gte: ['$$scheduleEnd', startMinutes] },
                          { $lte: ['$$scheduleEnd', endMinutes] }
                        ]},
                        { $and: [
                          { $lte: ['$$scheduleStart', startMinutes] },
                          { $gte: ['$$scheduleEnd', endMinutes] }
                        ]}
                      ]
                    }
                  }
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
                  $let: {
                    vars: {
                      scheduleStart: { 
                        $add: [
                          { $multiply: [{ $hour: '$startDate' }, 60] }, 
                          { $minute: '$startDate' }
                        ]
                      },
                      scheduleEnd: { 
                        $add: [
                          { $multiply: [{ $hour: '$endDate' }, 60] }, 
                          { $minute: '$endDate' }
                        ]
                      }
                    },
                    in: {
                      $or: [
                        { $and: [
                          { $gte: ['$$scheduleStart', startMinutes] },
                          { $lte: ['$$scheduleStart', endMinutes] }
                        ]},
                        { $and: [
                          { $gte: ['$$scheduleEnd', startMinutes] },
                          { $lte: ['$$scheduleEnd', endMinutes] }
                        ]},
                        { $and: [
                          { $lte: ['$$scheduleStart', startMinutes] },
                          { $gte: ['$$scheduleEnd', endMinutes] }
                        ]}
                      ]
                    }
                  }
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