const crypto = require('crypto');
const apiService = require('./apiService');
const Store = require('electron-store');
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
  // 6 haneli güvenli token oluştur
  return crypto.randomInt(100000, 999999).toString();
}

async function registerDeviceToken() {
  console.log('Generating new device token...');
  const token = generateSecureToken();
  const deviceInfo = getDeviceInfo();
  
  try {
    console.log('Registering token with API...', token);
    await apiService.registerToken(token, deviceInfo);
    
    // Token'ı güvenli şekilde sakla
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
  return store.get('deviceInfo')?.token;
}

module.exports = {
  registerDeviceToken,
  getStoredToken,
  getDeviceInfo
};