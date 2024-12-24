const mongoose = require('mongoose');

const getTimeInMinutes = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

const checkScheduleConflict = async (schedule) => {
  const PlaylistSchedule = mongoose.model('PlaylistSchedule');
  
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  
  // Base query to find potential conflicts
  const query = {
    status: 'active',
    _id: { $ne: schedule._id }
  };

  // Only check conflicts if devices or groups are selected
  if (schedule.targets.devices.length === 0 && schedule.targets.groups.length === 0) {
    return false;
  }

  // Add target device/group conditions
  query.$or = [];
  if (schedule.targets.devices.length > 0) {
    query.$or.push({ 'targets.devices': { $in: schedule.targets.devices } });
  }
  if (schedule.targets.groups.length > 0) {
    query.$or.push({ 'targets.groups': { $in: schedule.targets.groups } });
  }

  // Add time-based conditions based on repeat type
  switch (schedule.repeatType) {
    case 'once':
      query.startDate = { $lt: endDate };
      query.endDate = { $gt: startDate };
      break;

    case 'daily':
      const startMinutes = getTimeInMinutes(startDate);
      const endMinutes = getTimeInMinutes(endDate);
      
      query.repeatType = 'daily';
      query.$expr = {
        $and: [
          {
            $lte: [
              { $add: [
                { $multiply: [{ $hour: '$startDate' }, 60] },
                { $minute: '$startDate' }
              ]},
              endMinutes
            ]
          },
          {
            $gte: [
              { $add: [
                { $multiply: [{ $hour: '$endDate' }, 60] },
                { $minute: '$endDate' }
              ]},
              startMinutes
            ]
          }
        ]
      };
      break;

    case 'weekly':
      query.repeatType = 'weekly';
      query.$and = [
        { $expr: { $eq: [{ $dayOfWeek: '$startDate' }, { $dayOfWeek: startDate }] } },
        {
          $expr: {
            $and: [
              {
                $lte: [
                  { $add: [
                    { $multiply: [{ $hour: '$startDate' }, 60] },
                    { $minute: '$startDate' }
                  ]},
                  getTimeInMinutes(endDate)
                ]
              },
              {
                $gte: [
                  { $add: [
                    { $multiply: [{ $hour: '$endDate' }, 60] },
                    { $minute: '$endDate' }
                  ]},
                  getTimeInMinutes(startDate)
                ]
              }
            ]
          }
        }
      ];
      break;

    case 'monthly':
      query.repeatType = 'monthly';
      query.$and = [
        { $expr: { $eq: [{ $dayOfMonth: '$startDate' }, { $dayOfMonth: startDate }] } },
        {
          $expr: {
            $and: [
              {
                $lte: [
                  { $add: [
                    { $multiply: [{ $hour: '$startDate' }, 60] },
                    { $minute: '$startDate' }
                  ]},
                  getTimeInMinutes(endDate)
                ]
              },
              {
                $gte: [
                  { $add: [
                    { $multiply: [{ $hour: '$endDate' }, 60] },
                    { $minute: '$endDate' }
                  ]},
                  getTimeInMinutes(startDate)
                ]
              }
            ]
          }
        }
      ];
      break;
  }

  const conflictingSchedules = await PlaylistSchedule.find(query);
  return conflictingSchedules.length > 0;
};

module.exports = { checkScheduleConflict };