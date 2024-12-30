const Device = require('../models/Device');

class VolumeService {
  async saveVolume(deviceId, volume) {
    try {
      const device = await Device.findById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Volume değerini normalize et (0-100 arası)
      const normalizedVolume = Math.max(0, Math.min(100, volume));
      
      // Device'ın volume değerini güncelle
      device.volume = normalizedVolume;
      await device.save();

      return normalizedVolume;
    } catch (error) {
      console.error('Error saving volume:', error);
      throw error;
    }
  }
}

module.exports = new VolumeService();