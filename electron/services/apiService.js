const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function registerToken(token, deviceInfo) {
  try {
    console.log('Attempting to register token:', token);
    console.log('With device info:', deviceInfo);
    
    const response = await axios.post(`${API_URL}/tokens`, {
      token,
      deviceInfo
    });
    
    console.log('Token registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Token registration error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  registerToken
};