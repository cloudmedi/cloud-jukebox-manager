const Device = require('../../models/Device');
const DeviceGroup = require('../../models/DeviceGroup');
const PlaylistSchedule = require('../../models/PlaylistSchedule');
const Playlist = require('../../models/Playlist');

class ScheduleHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleSendSchedule(schedule) {
    try {
      console.log('[Schedule] Broadcasting schedule:', schedule._id);

      // Playlist detaylarını al
      const populatedSchedule = await PlaylistSchedule.findById(schedule._id)
        .populate({
          path: 'playlist',
          populate: {
            path: 'songs',
            select: 'name artist duration filePath' // filePath'i ekle
          }
        });

      if (!populatedSchedule) {
        console.log('[Schedule] Schedule not found after population');
        return false;
      }

      const targetDevices = new Set(schedule.targets.devices.map(id => id.toString()));

      // Grup hedeflerini ekle
      if (schedule.targets.groups && schedule.targets.groups.length > 0) {
        const deviceGroups = await DeviceGroup.find({
          _id: { $in: schedule.targets.groups }
        }).populate('devices');

        deviceGroups.forEach(group => {
          group.devices.forEach(device => {
            targetDevices.add(device._id.toString());
          });
        });
      }

      console.log('[Schedule] Target devices:', Array.from(targetDevices));

      // Schedule mesajını hazırla
      const scheduleMessage = {
        type: 'schedule-created',
        data: {
          id: populatedSchedule._id,
          playlist: {
            id: populatedSchedule.playlist._id,
            name: populatedSchedule.playlist.name,
            songs: populatedSchedule.playlist.songs.map(song => ({
              id: song._id,
              name: song.name,
              artist: song.artist,
              duration: song.duration,
              path: song.filePath // filePath'i path olarak ekle
            })),
            artwork: populatedSchedule.playlist.artwork,
            status: populatedSchedule.playlist.status
          },
          startDate: populatedSchedule.startDate,
          endDate: populatedSchedule.endDate,
          repeatType: populatedSchedule.repeatType
        }
      };

      console.log('[Schedule] Prepared message:', JSON.stringify(scheduleMessage, null, 2));

      for (const deviceId of targetDevices) {
        const device = await Device.findById(deviceId);
        if (device && device.token) {
          const deviceWs = this.wss.findDeviceWebSocket(device.token);
          
          if (deviceWs) {
            deviceWs.send(JSON.stringify(scheduleMessage));
            console.log('[Schedule] Sent to device:', deviceId);
          } else {
            console.log('[Schedule] Device not connected:', deviceId);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[Schedule] Error broadcasting schedule:', error);
      return false;
    }
  }

  async handleScheduleUpdate(schedule) {
    return this.handleSendSchedule(schedule);
  }

  async handleScheduleDelete(schedule) {
    try {
      console.log('[Schedule] Broadcasting schedule deletion:', schedule._id);

      const targetDevices = new Set(schedule.targets.devices.map(id => id.toString()));

      if (schedule.targets.groups && schedule.targets.groups.length > 0) {
        const deviceGroups = await DeviceGroup.find({
          _id: { $in: schedule.targets.groups }
        }).populate('devices');

        deviceGroups.forEach(group => {
          group.devices.forEach(device => {
            targetDevices.add(device._id.toString());
          });
        });
      }

      const deleteMessage = {
        type: 'schedule-deleted',
        data: { id: schedule._id }
      };

      for (const deviceId of targetDevices) {
        const device = await Device.findById(deviceId);
        if (device && device.token) {
          const deviceWs = this.wss.findDeviceWebSocket(device.token);
          
          if (deviceWs) {
            deviceWs.send(JSON.stringify(deleteMessage));
            console.log('[Schedule] Deletion sent to device:', deviceId);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[Schedule] Error broadcasting schedule deletion:', error);
      return false;
    }
  }
}

module.exports = ScheduleHandler;
