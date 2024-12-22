const { ipcRenderer } = require('electron');

// Device bilgilerini al
function getDeviceInfo() {
  ipcRenderer.send('get-device-info');
}

// Device bilgileri geldiğinde
ipcRenderer.on('device-info', (event, deviceInfo) => {
  if (deviceInfo) {
    document.getElementById('status').textContent = 'Connected';
    document.getElementById('device-token').textContent = deviceInfo.token;
  } else {
    // Yeni device bilgisi oluştur
    const newDeviceInfo = {
      token: generateToken(),
      createdAt: new Date().toISOString()
    };
    ipcRenderer.send('save-device-info', newDeviceInfo);
  }
});

// Token oluşturma
function generateToken() {
  return Math.random().toString(36).substring(2, 8);
}

// Sayfa yüklendiğinde device bilgilerini al
document.addEventListener('DOMContentLoaded', getDeviceInfo);