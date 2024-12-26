const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const { BrowserWindow } = require('electron');

class DeviceDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('device');
    this.store = new Store();
  }

  async preDelete(id) {
    // Cihazın mevcut olup olmadığını kontrol et
    const devices = this.store.get('devices', []);
    const device = devices.find(d => d._id === id);
    
    if (!device) {
      throw new Error('Device not found');
    }
  }

  async executeDelete(id) {
    try {
      // Store'dan cihazı kaldır
      const devices = this.store.get('devices', []);
      const updatedDevices = devices.filter(d => d._id !== id);
      this.store.set('devices', updatedDevices);

      // WebSocket bağlantısını kapat (eğer varsa)
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('close-device-connection', id);
      }

      console.log(`Device ${id} successfully deleted`);
    } catch (error) {
      console.error(`Error deleting device ${id}:`, error);
      throw error;
    }
  }

  async postDelete(id) {
    // UI'ı güncelle
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('device-deleted', id);
    }
  }
}

module.exports = DeviceDeleteHandler;