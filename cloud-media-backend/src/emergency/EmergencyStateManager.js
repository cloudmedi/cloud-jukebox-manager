const Device = require('../models/Device');
const Notification = require('../models/Notification');

class EmergencyStateManager {
  constructor() {
    this.isEmergencyActive = false;
    this.deviceStates = new Map(); // Store device states before emergency
  }

  async activateEmergency() {
    this.isEmergencyActive = true;
    
    try {
      // Store current device states before emergency
      const devices = await Device.find({});
      devices.forEach(device => {
        this.deviceStates.set(device.token, {
          volume: device.volume,
          playlistStatus: device.playlistStatus,
          isPlaying: device.isPlaying
        });
      });

      // Update all devices to emergency state
      await Device.updateMany({}, {
        emergencyStopped: true,
        playlistStatus: 'emergency-stopped',
        volume: 0,
        isPlaying: false
      });

      await Notification.create({
        type: 'emergency',
        title: 'Acil Durum Aktifleştirildi',
        message: 'Tüm cihazlar acil durum nedeniyle durduruldu',
        read: false
      });

      return true;
    } catch (error) {
      console.error('Emergency activation error:', error);
      return false;
    }
  }

  async deactivateEmergency() {
    this.isEmergencyActive = false;
    
    try {
      // Restore previous device states
      const devices = await Device.find({});
      for (const device of devices) {
        const previousState = this.deviceStates.get(device.token) || {
          volume: 50,
          playlistStatus: 'loaded',
          isPlaying: false
        };

        await Device.findByIdAndUpdate(device._id, {
          emergencyStopped: false,
          playlistStatus: previousState.playlistStatus,
          volume: previousState.volume,
          isPlaying: previousState.isPlaying
        });
      }

      // Clear stored states
      this.deviceStates.clear();

      await Notification.create({
        type: 'emergency',
        title: 'Acil Durum Devre Dışı',
        message: 'Acil durum durumu kaldırıldı, cihazlar normal çalışmaya devam ediyor',
        read: false
      });

      return true;
    } catch (error) {
      console.error('Emergency deactivation error:', error);
      return false;
    }
  }

  getEmergencyState() {
    return this.isEmergencyActive;
  }
}

module.exports = new EmergencyStateManager();