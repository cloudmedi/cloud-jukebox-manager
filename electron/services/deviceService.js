const crypto = require('crypto');
const Store = require('electron-store');
const apiService = require('./apiService');

const store = new Store({
  encryptionKey: crypto.randomBytes(32).toString('hex'),
  clearInvalidConfig: true
});

function getDeviceInfo() {
  return {
    hostname: require('os').hostname(),
    platform: process.platform,
    arch: process.arch,
    cpus: require('os').cpus()[0].model,
    totalMemory: `${Math.round(require('os').totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMemory: `${Math.round(require('os').freemem() / (1024 * 1024 * 1024))} GB`,
    networkInterfaces: Object.values(require('os').networkInterfaces())
      .flat()
      .filter(ni => !ni.internal && ni.family === 'IPv4')
      .map(ni => ni.address),
    osVersion: require('os').release()
  };
}

function generateSecureToken() {
  console.log('Generating new secure token...');
  return crypto.randomInt(100000, 999999).toString();
}

async function registerDeviceToken() {
  console.log('Starting device token registration...');
  const token = generateSecureToken();
  const deviceInfo = getDeviceInfo();
  
  try {
    console.log('Registering token with API...', token);
    await apiService.registerToken(token, deviceInfo);
    
    store.set('deviceInfo', { 
      token,
      registeredAt: new Date().toISOString(),
      deviceId: crypto.randomBytes(16).toString('hex')
    });
    
    console.log('Token registered and stored successfully');
    return token;
  } catch (error) {
    console.error('Token registration failed:', error);
    throw error;
  }
}

function getStoredToken() {
  console.log('Getting stored token...');
  const deviceInfo = store.get('deviceInfo');
  console.log('Stored device info:', deviceInfo);
  
  if (!deviceInfo?.token) {
    console.log('No token found, initiating registration...');
    return registerDeviceToken();
  }
  
  return deviceInfo.token;
}

module.exports = {
  registerDeviceToken,
  getStoredToken,
  getDeviceInfo
};