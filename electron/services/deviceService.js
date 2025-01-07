const os = require('os');
const Store = require('electron-store');
const store = new Store();
const apiService = require('./apiService');
const crypto = require('crypto');

// Karışıklığa neden olabilecek karakterleri çıkardık:
// Çıkarılanlar: 0, O, 1, I, l
const ALLOWED_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

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
  // 16 byte'lık rastgele veri oluştur
  const buffer = crypto.randomBytes(16);
  
  // Buffer'ı sayıya çevir
  let num = 0n;
  for (let i = 0; i < buffer.length; i++) {
    num = num * 256n + BigInt(buffer[i]);
  }
  
  // Sayıyı 6 karakterli token'a çevir
  let token = '';
  for (let i = 0; i < 6; i++) {
    const index = Number(num % BigInt(ALLOWED_CHARS.length));
    token = ALLOWED_CHARS[index] + token;
    num = num / BigInt(ALLOWED_CHARS.length);
  }
  
  return token;
}

async function registerDeviceToken() {
  try {
    // Önce mevcut token'ı kontrol et
    const existingToken = store.get('deviceToken');
    const existingDeviceId = store.get('deviceId');
    
    if (existingToken && existingDeviceId) {
      console.log('Using existing device registration:', { 
        token: existingToken,
        deviceId: existingDeviceId 
      });
      return existingToken;
    }

    // Mevcut kayıt yoksa yeni token oluştur
    console.log('No existing device registration found, creating new one...');
    
    let token;
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    // Token çakışması durumunda yeniden dene
    while (retryCount < maxRetries) {
      token = generateToken();
      const deviceInfo = getDeviceInfo();
      
      try {
        response = await apiService.registerToken(token, deviceInfo);
        if (response._id) {
          break; // Başarılı kayıt
        }
      } catch (error) {
        if (error.response?.status === 409) { // Token çakışması
          console.log('Token collision detected, retrying...');
          retryCount++;
          continue;
        }
        throw error; // Diğer hatalar
      }
    }

    if (!response?._id) {
      throw new Error('Failed to register device after multiple attempts');
    }

    // Token bilgilerini kaydet
    store.set('deviceId', response._id);
    store.set('deviceToken', token);
    console.log('New device registered successfully:', { 
      token,
      deviceId: response._id 
    });
    return token;
  } catch (error) {
    console.error('Error in device registration:', error);
    throw error;
  }
}

function getDeviceId() {
  const deviceId = store.get('deviceId');
  if (!deviceId) {
    console.warn('Device ID not found in store');
  }
  return deviceId;
}

function getDeviceToken() {
  const token = store.get('deviceToken');
  if (!token) {
    console.warn('Device token not found in store');
  }
  return token;
}

function resetDeviceRegistration() {
  store.delete('deviceId');
  store.delete('deviceToken');
  console.log('Device registration reset');
}

module.exports = {
  registerDeviceToken,
  getDeviceId,
  getDeviceToken,
  resetDeviceRegistration
};