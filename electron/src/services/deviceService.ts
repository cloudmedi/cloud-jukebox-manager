import os from 'os';
import { v4 as uuidv4 } from 'uuid';

interface DeviceInfo {
  token: string;
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
}

export class DeviceService {
  private static instance: DeviceService;
  private deviceToken: string | null = null;

  private constructor() {}

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  generateToken(): string {
    if (this.deviceToken) return this.deviceToken;
    
    // 6 haneli sayısal token oluştur
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    this.deviceToken = token;
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
      networkInterfaces: networkInterfaces
    };
  }
}

export default DeviceService;