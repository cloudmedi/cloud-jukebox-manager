const Device = require('../models/Device');
const Notification = require('../models/Notification');

class EmergencyStateManager {
  constructor() {
    this.isEmergencyActive = false;
  }

  async activateEmergency() {
    this.isEmergencyActive = true;
    
    try {
      // Tüm cihazları emergency-stopped durumuna getir
      await Device.updateMany({}, {
        emergencyStopped: true,
        playlistStatus: 'emergency-stopped',
        volume: 0
      });

      // Sistem bildirimi oluştur
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
      // Cihazların emergency durumunu kaldır
      await Device.updateMany({}, {
        emergencyStopped: false,
        playlistStatus: null
      });

      // Sistem bildirimi oluştur
      await Notification.create({
        type: 'emergency',
        title: 'Acil Durum Devre Dışı',
        message: 'Acil durum durumu kaldırıldı',
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