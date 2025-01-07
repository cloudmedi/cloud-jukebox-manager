const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const apiService = {
  // Token kaydı
  registerToken: async (token, deviceInfo) => {
    try {
      console.log('Registering token:', token, 'with device info:', deviceInfo);
      const response = await axios.post(`${API_URL}/tokens`, {
        token,
        deviceInfo
      });
      return response.data;
    } catch (error) {
      console.error('Token registration error:', error);
      throw error;
    }
  },

  // HTTP metodları
  get: async (endpoint) => {
    try {
      // Endpoint'in başında / varsa kaldır
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const response = await axios.get(`${API_URL}/${cleanEndpoint}`);
      return response.data;
    } catch (error) {
      console.error(`GET request error for ${endpoint}:`, error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    try {
      // Endpoint'in başında / varsa kaldır
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const response = await axios.post(`${API_URL}/${cleanEndpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`POST request error for ${endpoint}:`, error);
      throw error;
    }
  }
};

module.exports = apiService;