import os from 'os';
import Store from 'electron-store';

export interface DeviceInfo {
  token: string;
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
  osVersion: string;
}

export class DeviceService {
  private static instance: DeviceService;
  private store: Store;
  private deviceToken: string | null = null;

  private constructor() {
    this.store = new Store();
    this.deviceToken = this.store.get('deviceToken') as string || null;
  }

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  generateToken(): string {
    if (this.deviceToken) return this.deviceToken;
    
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    this.deviceToken = token;
    this.store.set('deviceToken', token);
    
    return token;
  }

  getDeviceInfo(): DeviceInfo {
    const networkInterfaces = Object.values(os.networkInterfaces())
      .flat()
      .filter(Boolean)
      .map(ni => ni?.address || '')
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

  clearToken(): void {
    this.deviceToken = null;
    this.store.delete('deviceToken');
  }
}

export default DeviceService;