const { v4: uuidv4 } = require('uuid');
const os = require('os');

let Store;

// Dynamic import for electron-store
import('electron-store').then(module => {
  Store = module.default;
}).catch(err => {
  console.error('Failed to load electron-store:', err);
});

class DeviceService {
  static instance = null;

  constructor() {
    if (!Store) {
      throw new Error('electron-store module not loaded');
    }
    
    this.store = new Store({
      name: 'device-config'
    });

    if (!this.store.get('deviceInfo')) {
      this.initializeDeviceInfo();
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

    this.store.set('deviceInfo', deviceInfo);
    return deviceInfo;
  }

  generateToken() {
    return Math.random().toString().slice(2, 8);
  }

  getDeviceInfo() {
    return this.store.get('deviceInfo');
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