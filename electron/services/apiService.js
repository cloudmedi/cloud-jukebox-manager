const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function registerToken(token, deviceInfo) {
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
}

async function savePlaybackHistory(playbackData) {
  try {
    console.log('Saving playback history:', playbackData);
    const response = await axios.post(`${API_URL}/playback-history`, playbackData);
    return response.data;
  } catch (error) {
    console.error('Playback history save error:', error);
    throw error;
  }
}

module.exports = {
  registerToken,
  savePlaybackHistory
};