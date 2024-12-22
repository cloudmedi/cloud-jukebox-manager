"use strict";
const Store = require('electron-store');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

class DeviceService {
  constructor() {
    this.store = new Store({
      name: 'device-config',
      defaults: {
        deviceInfo: null
      }
    });
  }

  initializeDeviceInfo() {
    const deviceInfo = {
      id: uuidv4(),
      token: this.generateToken(),
      platform: os.platform(),
      hostname: os.hostname(),
      cpus: `${os.cpus()[0].model} (${os.cpus().length} cores)`,
      totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      createdAt: new Date().toISOString()
    };

    this.store.set('deviceInfo', deviceInfo);
    return deviceInfo;
  }

  generateToken() {
    return Math.random().toString(36).substring(2, 8);
  }

  getDeviceInfo() {
    let deviceInfo = this.store.get('deviceInfo');
    if (!deviceInfo) {
      deviceInfo = this.initializeDeviceInfo();
    }
    return deviceInfo;
  }

  updateDeviceInfo(updates) {
    const currentInfo = this.getDeviceInfo();
    const updatedInfo = { ...currentInfo, ...updates };
    this.store.set('deviceInfo', updatedInfo);
    return updatedInfo;
  }

  clearDeviceInfo() {
    this.store.delete('deviceInfo');
  }
}

module.exports = DeviceService;