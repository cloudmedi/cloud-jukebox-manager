const mongoose = require('mongoose');

const getTimeInMinutes = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

const checkScheduleConflict = async (schedule) => {
  const PlaylistSchedule = mongoose.model('PlaylistSchedule');
  
  // Base query to find potential conflicts
  const query = {
    status: 'active',
    _id: { $ne: schedule._id }
  };

  // Only check conflicts if devices or groups are selected
  if (schedule.targets.devices.length > 0 || schedule.targets.groups.length > 0) {
    query.$or = [
      { 'targets.devices': { $in: schedule.targets.devices } },
      { 'targets.groups': { $in: schedule.targets.groups } }
    ];
  }

  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);

  switch (schedule.repeatType) {
    case 'once':
      query.startDate = { $lt: endDate };
      query.endDate = { $gt: startDate };
      break;

    case 'daily':
      // For daily schedules, we only need to check time overlap
      const startMinutes = getTimeInMinutes(startDate);
      const endMinutes = getTimeInMinutes(endDate);
      
      query.$and = [
        { repeatType: 'daily' },
        {
          $expr: {
            $let: {
              vars: {
                existingStart: { $hour: '$startDate' },
                existingEnd: { $hour: '$endDate' }
              },
              in: {
                $or: [
                  {
                    $and: [
                      { $lte: [{ $multiply: ['$$existingStart', 60] }, endMinutes] },
                      { $gte: [{ $multiply: ['$$existingEnd', 60] }, startMinutes] }
                    ]
                  }
                ]
              }
            }
          }
        }
      ];
      break;

    case 'weekly':
      query.$and = [
        { repeatType: 'weekly' },
        { $expr: { $eq: [{ $dayOfWeek: '$startDate' }, { $dayOfWeek: startDate }] } },
        {
          $expr: {
            $let: {
              vars: {
                existingStart: { $hour: '$startDate' },
                existingEnd: { $hour: '$endDate' }
              },
              in: {
                $or: [
                  {
                    $and: [
                      { $lte: [{ $multiply: ['$$existingStart', 60] }, getTimeInMinutes(endDate)] },
                      { $gte: [{ $multiply: ['$$existingEnd', 60] }, getTimeInMinutes(startDate)] }
                    ]
                  }
                ]
              }
            }
          }
        }
      ];
      break;

    case 'monthly':
      query.$and = [
        { repeatType: 'monthly' },
        { $expr: { $eq: [{ $dayOfMonth: '$startDate' }, { $dayOfMonth: startDate }] } },
        {
          $expr: {
            $let: {
              vars: {
                existingStart: { $hour: '$startDate' },
                existingEnd: { $hour: '$endDate' }
              },
              in: {
                $or: [
                  {
                    $and: [
                      { $lte: [{ $multiply: ['$$existingStart', 60] }, getTimeInMinutes(endDate)] },
                      { $gte: [{ $multiply: ['$$existingEnd', 60] }, getTimeInMinutes(startDate)] }
                    ]
                  }
                ]
              }
            }
          }
        }
      ];
      break;
  }

  const conflictingSchedules = await PlaylistSchedule.find(query);
  return conflictingSchedules.length > 0;
};

module.exports = { checkScheduleConflict };