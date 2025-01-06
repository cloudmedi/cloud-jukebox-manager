const axios = require('axios');
const Store = require('electron-store');
const store = new Store();

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000
    });
  }

  async post(url, data) {
    try {
      const response = await this.axios.post(url, data);
      return response;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  async get(url) {
    try {
      const response = await this.axios.get(url);
      return response;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  // Diğer HTTP metodları buraya eklenebilir
}

module.exports = new ApiService();