const { createLogger } = require('../../../utils/logger');
const DeleteMessage = require('../../../websocket/messages/DeleteMessage');
const Device = require('../../../models/Device');
const fs = require('fs');
const path = require('path');

const logger = createLogger('announcement-delete-handler');

class AnnouncementDeleteHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async preDelete(id) {
    logger.info(`Pre-delete phase for announcement ${id}`);
    
    // Tüm cihazlara silme başladı mesajı gönder
    const devices = await Device.find();
    devices.forEach(device => {
      try {
        if (device.wsConnection) {
          const message = DeleteMessage.createDeleteStarted('announcement', id);
          device.wsConnection.send(JSON.stringify(message));
        }
      } catch (error) {
        logger.error(`Error sending pre-delete message to device ${device._id}:`, error);
      }
    });
  }

  async postDelete(id) {
    logger.info(`Post-delete phase for announcement ${id}`);
    
    // Tüm cihazlara silme tamamlandı mesajı gönder
    const devices = await Device.find();
    devices.forEach(device => {
      try {
        if (device.wsConnection) {
          const message = DeleteMessage.createDeleteSuccess('announcement', id);
          device.wsConnection.send(JSON.stringify(message));
        }
      } catch (error) {
        logger.error(`Error sending post-delete message to device ${device._id}:`, error);
      }
    });
  }

  async handleError(id, error) {
    logger.error(`Error in announcement deletion ${id}:`, error);
    
    // Tüm cihazlara hata mesajı gönder
    const devices = await Device.find();
    devices.forEach(device => {
      try {
        if (device.wsConnection) {
          const message = DeleteMessage.createDeleteError('announcement', id, error.message);
          device.wsConnection.send(JSON.stringify(message));
        }
      } catch (err) {
        logger.error(`Error sending error message to device ${device._id}:`, err);
      }
    });
  }
}

module.exports = AnnouncementDeleteHandler;