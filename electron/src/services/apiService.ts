import axios from 'axios';
import { DeviceInfo } from './deviceService';

const API_URL = 'http://localhost:5000/api';

export class ApiService {
  private static instance: ApiService;

  private constructor() {
    // Axios default headers
    axios.defaults.headers.common['Content-Type'] = 'application/json';
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async registerToken(deviceInfo: DeviceInfo): Promise<any> {
    try {
      console.log('Registering token with device info:', deviceInfo);
      const response = await axios.post(`${API_URL}/tokens`, {
        token: deviceInfo.token,
        deviceInfo: {
          hostname: deviceInfo.hostname,
          platform: deviceInfo.platform,
          arch: deviceInfo.arch,
          cpus: deviceInfo.cpus,
          totalMemory: deviceInfo.totalMemory,
          freeMemory: deviceInfo.freeMemory,
          networkInterfaces: deviceInfo.networkInterfaces,
          osVersion: deviceInfo.osVersion
        }
      });
      console.log('Token registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Token registration error:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/tokens/validate/${token}`);
      return response.status === 200;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}

export default ApiService;