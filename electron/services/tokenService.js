const { ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
const deviceService = require('./deviceService');

async function generateAndRegisterToken() {
  try {
    // 6 haneli random token oluştur
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const deviceInfo = deviceService.getDeviceInfo();

    // Token'ı backend'e kaydet
    const response = await fetch('http://localhost:5000/api/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        deviceInfo
      })
    });

    if (!response.ok) {
      throw new Error('Token kaydedilemedi');
    }

    // Token ve cihaz bilgilerini local store'a kaydet
    store.set('deviceInfo', {
      token,
      ...deviceInfo
    });

    return { token, deviceInfo };
  } catch (error) {
    console.error('Token oluşturma hatası:', error);
    throw error;
  }
}

function initializeTokenHandlers(mainWindow) {
  // Token kontrolü yap
  ipcMain.handle('check-token', async () => {
    const deviceInfo = store.get('deviceInfo');
    
    if (!deviceInfo || !deviceInfo.token) {
      try {
        // Token yoksa yeni oluştur
        const result = await generateAndRegisterToken();
        mainWindow.webContents.send('token-created', result);
        return result;
      } catch (error) {
        mainWindow.webContents.send('token-error', error.message);
        throw error;
      }
    }
    
    return deviceInfo;
  });
}

module.exports = {
  generateAndRegisterToken,
  initializeTokenHandlers
};