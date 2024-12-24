const mongoose = require('mongoose');

const getTimeInMinutes = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

const checkScheduleConflict = async (schedule) => {
  const query = {
    status: 'active',
    _id: { $ne: schedule._id }
  };

  if (schedule.targets.devices.length > 0 || schedule.targets.groups.length > 0) {
    query.$or = [
      { 'targets.devices': { $in: schedule.targets.devices } },
      { 'targets.groups': { $in: schedule.targets.groups } }
    ];
  }

  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  const startMinutes = getTimeInMinutes(startDate);
  const endMinutes = getTimeInMinutes(endDate);

  switch (schedule.repeatType) {
    case 'once':
      query.startDate = { $lt: endDate };
      query.endDate = { $gt: startDate };
      break;

    case 'daily':
      query.$expr = {
        $and: [
          {
            $or: [
              {
                $and: [
                  { $lte: [{ $hour: '$startDate' }, endDate.getHours()] },
                  { $gte: [{ $hour: '$startDate' }, startDate.getHours()] }
                ]
              },
              {
                $and: [
                  { $lte: [{ $hour: '$endDate' }, endDate.getHours()] },
                  { $gte: [{ $hour: '$endDate' }, startDate.getHours()] }
                ]
              }
            ]
          },
          { $eq: ['$repeatType', 'daily'] }
        ]
      };
      break;

    case 'weekly':
      query.$expr = {
        $and: [
          { $eq: [{ $dayOfWeek: '$startDate' }, { $dayOfWeek: startDate }] },
          { $eq: ['$repeatType', 'weekly'] },
          {
            $or: [
              {
                $and: [
                  { $lte: [{ $hour: '$startDate' }, endDate.getHours()] },
                  { $gte: [{ $hour: '$startDate' }, startDate.getHours()] }
                ]
              },
              {
                $and: [
                  { $lte: [{ $hour: '$endDate' }, endDate.getHours()] },
                  { $gte: [{ $hour: '$endDate' }, startDate.getHours()] }
                ]
              }
            ]
          }
        ]
      };
      break;

    case 'monthly':
      query.$expr = {
        $and: [
          { $eq: [{ $dayOfMonth: '$startDate' }, { $dayOfMonth: startDate }] },
          { $eq: ['$repeatType', 'monthly'] },
          {
            $or: [
              {
                $and: [
                  { $lte: [{ $hour: '$startDate' }, endDate.getHours()] },
                  { $gte: [{ $hour: '$startDate' }, startDate.getHours()] }
                ]
              },
              {
                $and: [
                  { $lte: [{ $hour: '$endDate' }, endDate.getHours()] },
                  { $gte: [{ $hour: '$endDate' }, startDate.getHours()] }
                ]
              }
            ]
          }
        ]
      };
      break;
  }

  const PlaylistSchedule = mongoose.model('PlaylistSchedule');
  const conflictingSchedules = await PlaylistSchedule.find(query);
  return conflictingSchedules.length > 0;
};

module.exports = { checkScheduleConflict };