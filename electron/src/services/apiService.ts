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

  async registerDevice(deviceInfo: DeviceInfo): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/devices`, {
        name: deviceInfo.hostname,
        token: deviceInfo.token,
        location: deviceInfo.platform,
        ipAddress: deviceInfo.networkInterfaces[0],
        volume: 50
      });
      return response.data;
    } catch (error) {
      console.error('Device registration failed:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/devices?token=${token}`);
      return response.data.length > 0;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}

export default ApiService;