const os = require('os');
let Store;

// Dynamic import for electron-store
import('electron-store').then(module => {
  Store = module.default;
}).catch(err => {
  console.error('Failed to load electron-store:', err);
});

class DeviceService {
  constructor() {
    if (!Store) {
      throw new Error('electron-store module not loaded');
    }
    
    this.store = new Store({
      name: 'device-config'
    });
    this.deviceToken = this.store.get('deviceToken');
  }

  generateToken() {
    if (this.deviceToken) return this.deviceToken;
    
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    this.setToken(token);
    return token;
  }

  setToken(token) {
    this.deviceToken = token;
    this.store.set('deviceToken', token);
  }

  getDeviceInfo() {
    const networkInterfaces = Object.values(os.networkInterfaces())
      .flat()
      .filter(ni => ni !== undefined)
      .map(ni => ni.address)
      .filter(addr => addr && !addr.includes(':'));

    return {
      token: this.deviceToken || this.generateToken(),
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: `${os.cpus()[0].model} (${os.cpus().length} cores)`,
      totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
      networkInterfaces: networkInterfaces,
      osVersion: os.release()
    };
  }

  clearToken() {
    this.deviceToken = null;
    this.store.delete('deviceToken');
  }
}

module.exports = DeviceService;