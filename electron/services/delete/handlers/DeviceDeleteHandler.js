const BaseDeleteHandler = require('./BaseDeleteHandler');

class DeviceDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('device');
  }

  async preDelete(id, data) {
    this.logger.info(`Starting pre-delete phase for device ${id}`);
    // Cihaz silme öncesi işlemler
  }

  async executeDelete(id, data) {
    this.logger.info(`Executing delete for device ${id}`);
    // Cihazı yerel depolamadan kaldır
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('device-deleted', id);
    }
  }

  async postDelete(id, data) {
    this.logger.info(`Completing post-delete phase for device ${id}`);
    // Cihaz silme sonrası temizlik işlemleri
  }
}

module.exports = DeviceDeleteHandler;