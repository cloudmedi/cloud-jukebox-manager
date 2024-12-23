const os = require('os');
const apiService = require('./apiService');

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

function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function registerDeviceToken() {
  const token = generateToken();
  const deviceInfo = getDeviceInfo();
  
  try {
    await apiService.registerToken(token, deviceInfo);
    return token;
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
}

module.exports = {
  getDeviceInfo,
  generateToken,
  registerDeviceToken
};