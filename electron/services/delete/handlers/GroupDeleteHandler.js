const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const { BrowserWindow } = require('electron');

class GroupDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('group');
    this.store = new Store();
  }

  async preDelete(id) {
    // Grubun mevcut olup olmadığını kontrol et
    const groups = this.store.get('device-groups', []);
    const group = groups.find(g => g._id === id);
    
    if (!group) {
      throw new Error('Group not found');
    }
  }

  async executeDelete(id) {
    try {
      // Store'dan grubu kaldır
      const groups = this.store.get('device-groups', []);
      const updatedGroups = groups.filter(g => g._id !== id);
      this.store.set('device-groups', updatedGroups);

      // Gruptaki cihazların grup referanslarını temizle
      const devices = this.store.get('devices', []);
      const updatedDevices = devices.map(device => {
        if (device.groupId === id) {
          return { ...device, groupId: null };
        }
        return device;
      });
      this.store.set('devices', updatedDevices);

      console.log(`Group ${id} successfully deleted`);
    } catch (error) {
      console.error(`Error deleting group ${id}:`, error);
      throw error;
    }
  }

  async postDelete(id) {
    // UI'ı güncelle
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('group-deleted', id);
      
      // Cihazların grup referansları temizlendiği için UI'ı güncelle
      mainWindow.webContents.send('devices-updated');
    }
  }
}

module.exports = GroupDeleteHandler;