import axios from 'axios';
import { DeviceInfo } from './deviceService';

const API_URL = 'http://localhost:5000/api';

export class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async registerToken(deviceInfo: DeviceInfo): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/tokens`, {
        token: deviceInfo.token,
        deviceInfo: {
          hostname: deviceInfo.hostname,
          platform: deviceInfo.platform,
          arch: deviceInfo.arch,
          cpus: deviceInfo.cpus,
          totalMemory: deviceInfo.totalMemory,
          freeMemory: deviceInfo.freeMemory,
          networkInterfaces: deviceInfo.networkInterfaces
        }
      });
      return response.data;
    } catch (error) {
      console.error('Token registration failed:', error);
      throw error;
    }
  }
}

export default ApiService;