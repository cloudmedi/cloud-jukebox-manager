const os = require('os');
const Store = require('electron-store');
const store = new Store();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function generateAndRegisterToken() {
  try {
    // Token oluştur
    const token = generateToken();
    console.log('Generated token:', token);

    // Cihaz bilgilerini topla
    const deviceInfo = getDeviceInfo();
    console.log('Device info:', deviceInfo);

    // Backend'e token'ı kaydet
    const response = await axios.post(`${API_URL}/tokens`, {
      token,
      deviceInfo
    });

    if (response.data) {
      // Local storage'a kaydet
      store.set('deviceInfo', { token });
      console.log('Token saved to local storage:', token);
      return token;
    }
  } catch (error) {
    console.error('Error registering token:', error);
    throw error;
  }
}

function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getDeviceInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus()[0].model,
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
    networkInterfaces: Object.values(os.networkInterfaces())
      .flat()
      .filter(ni => !ni.internal && ni.family === 'IPv4')
      .map(ni => ni.address),
    osVersion: os.release()
  };
}

function getStoredToken() {
  const deviceInfo = store.get('deviceInfo');
  return deviceInfo?.token || null;
}

module.exports = {
  generateAndRegisterToken,
  getStoredToken,
  getDeviceInfo
};