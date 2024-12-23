const { generateToken } = require('./deviceService');
const { registerToken } = require('./apiService');
const Store = require('electron-store');
const store = new Store();

function generateAndSaveToken() {
  try {
    // 6 haneli yeni token oluştur
    const token = generateToken();
    
    // Device bilgilerini al
    const deviceInfo = {
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

    // Token'ı backend'e kaydet
    registerToken(token, deviceInfo)
      .then(() => {
        console.log('Token başarıyla kaydedildi:', token);
        // Token'ı local storage'a kaydet
        store.set('deviceInfo', { token, deviceInfo });
      })
      .catch(error => {
        console.error('Token kaydedilirken hata:', error);
      });

    return token;
  } catch (error) {
    console.error('Token oluşturma hatası:', error);
    return null;
  }
}

function getStoredToken() {
  const deviceInfo = store.get('deviceInfo');
  return deviceInfo ? deviceInfo.token : null;
}

module.exports = {
  generateAndSaveToken,
  getStoredToken
};