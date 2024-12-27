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
  const token = crypto.randomInt(100000, 999999).toString();
  console.log('Generated token:', token);
  return token;
}

function initializeDeviceToken() {
  console.log('Initializing device token...');
  const existingInfo = store.get('deviceInfo');
  
  if (existingInfo?.token) {
    console.log('Found existing token:', existingInfo.token);
    return existingInfo.token;
  }

  const token = generateSecureToken();
  const deviceInfo = getDeviceInfo();
  
  const deviceData = { 
    token,
    deviceInfo,
    registeredAt: new Date().toISOString(),
    deviceId: crypto.randomBytes(16).toString('hex')
  };

  store.set('deviceInfo', deviceData);
  console.log('Stored new device info:', deviceData);

  // API'ye kayıt işlemini başlat ama beklemeden token'ı dön
  apiService.registerToken(token, deviceInfo)
    .then(() => console.log('Token registered with API successfully'))
    .catch(error => console.error('Token registration error:', error));

  return token;
}

async function registerDeviceToken() {
  console.log('Starting device token registration...');
  const token = initializeDeviceToken();
  return token;
}

function getStoredToken() {
  console.log('Getting stored token...');
  const deviceInfo = store.get('deviceInfo');
  console.log('Stored device info:', deviceInfo);

  if (!deviceInfo?.token) {
    console.log('No token found, initiating registration...');
    return initializeDeviceToken();
  }

  return deviceInfo.token;
}

module.exports = {
  registerDeviceToken,
  getStoredToken,
  getDeviceInfo
};