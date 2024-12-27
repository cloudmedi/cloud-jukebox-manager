const { electronAPI, secureConsole } = window;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const deviceInfo = await electronAPI.getDeviceInfo();
    if (deviceInfo?.token) {
      updateUIWithDeviceInfo(deviceInfo);
    } else {
      await initializeNewDevice();
    }
  } catch (error) {
    secureConsole.error('Error initializing device:', error);
    showError('Cihaz başlatılırken bir hata oluştu');
  }
});

// Güvenli hata gösterimi
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

// UI güncelleme
function updateUIWithDeviceInfo(deviceInfo) {
  const deviceInfoElement = document.getElementById('deviceInfo');
  if (deviceInfoElement) {
    // Token bilgisini güvenli şekilde göster
    deviceInfoElement.querySelector('.connection-status').textContent = 
      deviceInfo.token ? 'Bağlı' : 'Bağlı Değil';
  }
}

// Yeni cihaz başlatma
async function initializeNewDevice() {
  try {
    const result = await electronAPI.saveDeviceInfo({
      token: generateSecureToken(),
      timestamp: Date.now()
    });
    
    if (!result) {
      throw new Error('Cihaz kaydedilemedi');
    }
  } catch (error) {
    secureConsole.error('Error initializing new device:', error);
    showError('Yeni cihaz oluşturulurken bir hata oluştu');
  }
}

// Güvenli token oluşturma
function generateSecureToken() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0].toString().padStart(6, '0').slice(0, 6);
}
