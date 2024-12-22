"use strict";
const Store = require('electron-store');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

class DeviceService {
  constructor() {
    try {
      console.log('Initializing DeviceService...');
      this.store = new Store({
        name: 'device-config',
        defaults: {
          deviceInfo: null
        }
      });
      console.log('Store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize store:', error);
      throw new Error('Store initialization failed');
    }
  }

  initializeDeviceInfo() {
    try {
      console.log('Initializing device info...');
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
      console.log('Device info initialized:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Failed to initialize device info:', error);
      throw error;
    }
  }

  generateToken() {
    try {
      return Math.random().toString(36).substring(2, 8);
    } catch (error) {
      console.error('Failed to generate token:', error);
      throw error;
    }
  }

  getDeviceInfo() {
    try {
      console.log('Getting device info...');
      let deviceInfo = this.store.get('deviceInfo');
      if (!deviceInfo) {
        console.log('No device info found, initializing...');
        deviceInfo = this.initializeDeviceInfo();
      }
      return deviceInfo;
    } catch (error) {
      console.error('Failed to get device info:', error);
      throw error;
    }
  }

  updateDeviceInfo(updates) {
    try {
      const currentInfo = this.getDeviceInfo();
      const updatedInfo = { ...currentInfo, ...updates };
      this.store.set('deviceInfo', updatedInfo);
      console.log('Device info updated:', updatedInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Failed to update device info:', error);
      throw error;
    }
  }

  clearDeviceInfo() {
    try {
      this.store.delete('deviceInfo');
      console.log('Device info cleared');
    } catch (error) {
      console.error('Failed to clear device info:', error);
      throw error;
    }
  }
}

module.exports = DeviceService;