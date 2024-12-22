const { ipcRenderer } = require('electron');
const { getDeviceInfo, generateToken } = require('./services/deviceService');
const { registerToken } = require('./services/apiService');

async function initializeDevice() {
  try {
    // Mevcut device bilgilerini kontrol et
    const existingInfo = await ipcRenderer.invoke('get-device-info');
    
    if (!existingInfo) {
      // Yeni token ve cihaz bilgileri oluştur
      const token = generateToken();
      const deviceInfo = getDeviceInfo();
      
      // Token'ı MongoDB'ye kaydet
      await registerToken(token, deviceInfo);
      
      // Bilgileri local'e kaydet
      await ipcRenderer.invoke('save-device-info', { token, deviceInfo });
      
      // UI'ı güncelle
      updateUI({ token, deviceInfo });
    } else {
      // Mevcut bilgileri UI'da göster
      updateUI(existingInfo);
    }
  } catch (error) {
    console.error('Device initialization error:', error);
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
}

function updateUI(info) {
  document.getElementById('status').textContent = 'Connected';
  document.getElementById('device-token').textContent = info.token;
  
  // Cihaz bilgilerini göster
  const deviceInfoHtml = Object.entries(info.deviceInfo || {})
    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
    .join('');
  
  document.getElementById('device-info').innerHTML += deviceInfoHtml;
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', initializeDevice);