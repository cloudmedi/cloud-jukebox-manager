const Store = require('electron-store');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

class DeviceService {
  static instance = null;
  store = null;

  constructor() {
    // Store'u lazy loading ile başlat
    if (!this.store) {
      try {
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
  }

  static getInstance() {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
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

    try {
      this.store.set('deviceInfo', deviceInfo);
      console.log('Device info initialized:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Failed to initialize device info:', error);
      throw error;
    }
  }

  generateToken() {
    return Math.random().toString(36).substring(2, 8);
  }

  getDeviceInfo() {
    try {
      let deviceInfo = this.store.get('deviceInfo');
      if (!deviceInfo) {
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
      return updatedInfo;
    } catch (error) {
      console.error('Failed to update device info:', error);
      throw error;
    }
  }

  clearDeviceInfo() {
    try {
      this.store.delete('deviceInfo');
    } catch (error) {
      console.error('Failed to clear device info:', error);
      throw error;
    }
  }
}

module.exports = DeviceService;