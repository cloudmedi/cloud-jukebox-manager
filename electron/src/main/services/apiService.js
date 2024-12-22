const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

class ApiService {
  static instance = null;

  constructor() {
    axios.defaults.headers.common['Content-Type'] = 'application/json';
  }

  static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async registerToken(deviceInfo) {
    try {
      const validationResponse = await this.validateToken(deviceInfo.token);
      if (validationResponse) {
        console.log('Token already exists, using existing token');
        return validationResponse;
      }

      console.log('Registering new token with device info:', deviceInfo);
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

  async validateToken(token) {
    try {
      const response = await axios.get(`${API_URL}/tokens/validate/${token}`);
      return response.data;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }
}

module.exports = ApiService;