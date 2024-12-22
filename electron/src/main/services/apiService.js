const axios = require('axios');

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        data
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

module.exports = ApiService;