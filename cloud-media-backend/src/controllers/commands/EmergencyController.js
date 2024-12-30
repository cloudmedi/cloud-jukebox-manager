const Device = require('../../models/Device');
const EmergencyStateManager = require('../../emergency/EmergencyStateManager');

class EmergencyController {
  static async emergencyStop(req, res) {
    try {
      await EmergencyStateManager.activateEmergency();
      
      const devices = await Device.find({ isOnline: true });
      
      for (const device of devices) {
        const sent = req.wss.sendToDevice(device.token, {
          type: 'command',
          command: 'emergency-stop'
        });

        if (!sent) {
          console.error(`Failed to send emergency stop to device ${device.token}`);
        }
      }

      req.wss.broadcastToAdmins({
        type: 'emergency',
        action: 'stopped',
        message: 'Tüm cihazlar acil durum nedeniyle durduruldu'
      });

      res.json({ message: 'Acil durum durdurma komutu gönderildi' });
    } catch (error) {
      console.error('Emergency stop error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async emergencyReset(req, res) {
    try {
      await EmergencyStateManager.deactivateEmergency();
      
      const devices = await Device.find({ emergencyStopped: true });
      
      for (const device of devices) {
        const sent = req.wss.sendToDevice(device.token, {
          type: 'command',
          command: 'emergency-reset',
          action: 'resume-playback',
          resumePlayback: true
        });

        if (!sent) {
          console.error(`Failed to send emergency reset to device ${device.token}`);
        }
      }

      req.wss.broadcastToAdmins({
        type: 'emergency',
        action: 'reset',
        message: 'Acil durum durumu kaldırıldı, cihazlar normal çalışmaya devam ediyor'
      });

      res.json({ message: 'Acil durum sıfırlama komutu gönderildi' });
    } catch (error) {
      console.error('Emergency reset error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = EmergencyController;